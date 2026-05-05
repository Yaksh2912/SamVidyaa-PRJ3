package com.samvidya.dao;

import com.samvidya.model.PeerHelpRecord;
import com.samvidya.model.PeerHelpRequest;
import com.samvidya.util.DatabaseUtil;

import java.sql.*;
import java.util.ArrayList;
import java.util.List;

public class PeerHelpDAO {

    // ── Requests ─────────────────────────────────────────────────────────────

    /** Create a new PENDING request. Returns the generated id. */
    public long createRequest(PeerHelpRequest req) throws SQLException {
        String sql = "INSERT INTO peer_help_requests " +
                     "(requester_id, helper_id, course_id, module_id, task_id, status) " +
                     "VALUES (?, ?, ?, ?, ?, 'PENDING')";
        try (Connection conn = DatabaseUtil.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql, Statement.RETURN_GENERATED_KEYS)) {
            stmt.setLong(1, req.getRequesterId());
            stmt.setLong(2, req.getHelperId());
            stmt.setLong(3, req.getCourseId());
            stmt.setLong(4, req.getModuleId());
            stmt.setLong(5, req.getTaskId());
            stmt.executeUpdate();
            try (ResultSet rs = stmt.getGeneratedKeys()) {
                if (rs.next()) {
                    long id = rs.getLong(1);
                    req.setId(id);
                    return id;
                }
            }
        }
        throw new SQLException("Failed to create peer help request");
    }

    /** Poll: get PENDING requests for a helper that are not yet expired (< 60s old). */
    public List<PeerHelpRequest> findPendingForHelper(long helperId) throws SQLException {
        String sql =
            "SELECT r.*, u.full_name AS requester_name, t.task_name, c.course_name " +
            "FROM peer_help_requests r " +
            "JOIN users u ON r.requester_id = u.id " +
            "JOIN tasks t ON r.task_id = t.id " +
            "JOIN courses c ON r.course_id = c.id " +
            "WHERE r.helper_id = ? AND r.status = 'PENDING' " +
            "  AND r.created_at >= NOW() - INTERVAL 60 SECOND " +
            "ORDER BY r.created_at DESC";
        List<PeerHelpRequest> list = new ArrayList<>();
        try (Connection conn = DatabaseUtil.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setLong(1, helperId);
            ResultSet rs = stmt.executeQuery();
            while (rs.next()) list.add(mapRequest(rs));
        }
        return list;
    }

    /** Get a single request by id. */
    public PeerHelpRequest findById(long requestId) throws SQLException {
        String sql =
            "SELECT r.*, u.full_name AS requester_name, t.task_name, c.course_name " +
            "FROM peer_help_requests r " +
            "JOIN users u ON r.requester_id = u.id " +
            "JOIN tasks t ON r.task_id = t.id " +
            "JOIN courses c ON r.course_id = c.id " +
            "WHERE r.id = ?";
        try (Connection conn = DatabaseUtil.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setLong(1, requestId);
            ResultSet rs = stmt.executeQuery();
            if (rs.next()) return mapRequest(rs);
        }
        return null;
    }

    /** Update request status. */
    public void updateStatus(long requestId, String status) throws SQLException {
        String sql = "UPDATE peer_help_requests SET status = ?, " +
                     "responded_at = CASE WHEN ? IN ('ACCEPTED','REJECTED') THEN NOW() ELSE responded_at END, " +
                     "completed_at = CASE WHEN ? = 'COMPLETED' THEN NOW() ELSE completed_at END " +
                     "WHERE id = ?";
        try (Connection conn = DatabaseUtil.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setString(1, status);
            stmt.setString(2, status);
            stmt.setString(3, status);
            stmt.setLong(4, requestId);
            stmt.executeUpdate();
        }
    }

    /** Expire all PENDING requests older than 60 seconds. */
    public void expireOldRequests() throws SQLException {
        String sql = "UPDATE peer_help_requests SET status = 'EXPIRED' " +
                     "WHERE status = 'PENDING' AND created_at < NOW() - INTERVAL 60 SECOND";
        try (Connection conn = DatabaseUtil.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.executeUpdate();
        }
    }

    /** Check if requester already has a PENDING/ACCEPTED request for this task. */
    public boolean hasActiveRequest(long requesterId, long taskId) throws SQLException {
        String sql = "SELECT COUNT(*) FROM peer_help_requests " +
                     "WHERE requester_id = ? AND task_id = ? AND status IN ('PENDING','ACCEPTED')";
        try (Connection conn = DatabaseUtil.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setLong(1, requesterId);
            stmt.setLong(2, taskId);
            ResultSet rs = stmt.executeQuery();
            return rs.next() && rs.getInt(1) > 0;
        }
    }

    /**
     * Check if a peer (by userId) has access to a course via enrollment number or email.
     * Used to validate the peer before sending a help request.
     */
    public boolean peerHasCourseAccess(long peerId, long courseId) throws SQLException {
        // Check via enrollment number
        String sql1 = "SELECT u.enrollment_number FROM users u WHERE u.id = ?";
        String enrollmentNumber = null;
        String email = null;
        try (Connection conn = DatabaseUtil.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql1)) {
            stmt.setLong(1, peerId);
            ResultSet rs = stmt.executeQuery();
            if (rs.next()) {
                enrollmentNumber = rs.getString("enrollment_number");
            }
        }
        // Also get email
        String sql2 = "SELECT email FROM users WHERE id = ?";
        try (Connection conn = DatabaseUtil.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql2)) {
            stmt.setLong(1, peerId);
            ResultSet rs = stmt.executeQuery();
            if (rs.next()) email = rs.getString("email");
        }

        // Check enrollment number access (exact + range)
        if (enrollmentNumber != null && !enrollmentNumber.isEmpty()) {
            String exactSql = "SELECT COUNT(*) FROM enrollment_numbers " +
                              "WHERE enrollment_number = ? AND course_id = ? AND is_active = TRUE";
            try (Connection conn = DatabaseUtil.getConnection();
                 PreparedStatement stmt = conn.prepareStatement(exactSql)) {
                stmt.setString(1, enrollmentNumber);
                stmt.setLong(2, courseId);
                ResultSet rs = stmt.executeQuery();
                if (rs.next() && rs.getInt(1) > 0) return true;
            }
            // Range check
            String rangeSql = "SELECT enrollment_number FROM enrollment_numbers " +
                              "WHERE enrollment_number LIKE '%-%' AND course_id = ? AND is_active = TRUE";
            try (Connection conn = DatabaseUtil.getConnection();
                 PreparedStatement stmt = conn.prepareStatement(rangeSql)) {
                stmt.setLong(1, courseId);
                ResultSet rs = stmt.executeQuery();
                while (rs.next()) {
                    String range = rs.getString(1);
                    String[] parts = range.split("-");
                    if (parts.length == 2) {
                        try {
                            long num = Long.parseLong(enrollmentNumber.trim());
                            long lo = Long.parseLong(parts[0].trim());
                            long hi = Long.parseLong(parts[1].trim());
                            if (num >= lo && num <= hi) return true;
                        } catch (NumberFormatException ignored) {}
                    }
                }
            }
        }

        // Check email access
        if (email != null && !email.isEmpty()) {
            String emailSql = "SELECT COUNT(*) FROM course_email_access " +
                              "WHERE email = ? AND course_id = ? AND is_active = TRUE";
            try (Connection conn = DatabaseUtil.getConnection();
                 PreparedStatement stmt = conn.prepareStatement(emailSql)) {
                stmt.setString(1, email.toLowerCase().trim());
                stmt.setLong(2, courseId);
                ResultSet rs = stmt.executeQuery();
                if (rs.next() && rs.getInt(1) > 0) return true;
            }
        }
        return false;
    }

    /**
     * Poll: find a COMPLETED request where this student was the requester and task matches.
     * Used by the requester's screen to detect when help has been delivered.
     */
    public PeerHelpRequest findCompletedForRequester(long requesterId, long taskId) throws SQLException {
        String sql =
            "SELECT r.*, u.full_name AS requester_name, t.task_name, c.course_name " +
            "FROM peer_help_requests r " +
            "JOIN users u ON r.requester_id = u.id " +
            "JOIN tasks t ON r.task_id = t.id " +
            "JOIN courses c ON r.course_id = c.id " +
            "WHERE r.requester_id = ? AND r.task_id = ? AND r.status = 'COMPLETED' " +
            "ORDER BY r.completed_at DESC LIMIT 1";
        try (Connection conn = DatabaseUtil.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setLong(1, requesterId);
            stmt.setLong(2, taskId);
            ResultSet rs = stmt.executeQuery();
            if (rs.next()) return mapRequest(rs);
        }
        return null;
    }

    // ── Records ───────────────────────────────────────────────────────────────

    /** Save a completed peer help record. */
    public void createRecord(PeerHelpRecord record) throws SQLException {
        String sql = "INSERT INTO peer_help_records " +
                     "(request_id, helper_id, helped_student_id, course_id, task_id, " +
                     " points_earned, helper_points, helped_points) " +
                     "VALUES (?, ?, ?, ?, ?, ?, ?, ?)";
        try (Connection conn = DatabaseUtil.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql, Statement.RETURN_GENERATED_KEYS)) {
            stmt.setLong(1, record.getRequestId());
            stmt.setLong(2, record.getHelperId());
            stmt.setLong(3, record.getHelpedStudentId());
            stmt.setLong(4, record.getCourseId());
            stmt.setLong(5, record.getTaskId());
            stmt.setInt(6, record.getPointsEarned());
            stmt.setInt(7, record.getHelperPoints());
            stmt.setInt(8, record.getHelpedPoints());
            stmt.executeUpdate();
            try (ResultSet rs = stmt.getGeneratedKeys()) {
                if (rs.next()) record.setId(rs.getLong(1));
            }
        }
    }

    /** Increment peer_helps_given, peer_help_points_earned, AND total_course_points for the helper. */
    public void incrementHelperStats(long helperId, long courseId, int pointsEarned) throws SQLException {
        String sql = "UPDATE student_course_progress " +
                     "SET peer_helps_given = peer_helps_given + 1, " +
                     "    peer_help_points_earned = peer_help_points_earned + ?, " +
                     "    total_course_points = total_course_points + ? " +
                     "WHERE student_id = ? AND course_id = ?";
        try (Connection conn = DatabaseUtil.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setInt(1, pointsEarned);
            stmt.setInt(2, pointsEarned);
            stmt.setLong(3, helperId);
            stmt.setLong(4, courseId);
            stmt.executeUpdate();
        }
    }

    // ── Mapper ────────────────────────────────────────────────────────────────

    private PeerHelpRequest mapRequest(ResultSet rs) throws SQLException {
        PeerHelpRequest r = new PeerHelpRequest();
        r.setId(rs.getLong("id"));
        r.setRequesterId(rs.getLong("requester_id"));
        r.setHelperId(rs.getLong("helper_id"));
        r.setCourseId(rs.getLong("course_id"));
        r.setModuleId(rs.getLong("module_id"));
        r.setTaskId(rs.getLong("task_id"));
        r.setStatus(rs.getString("status"));
        Timestamp ca = rs.getTimestamp("created_at");
        if (ca != null) r.setCreatedAt(ca.toLocalDateTime());
        Timestamp ra = rs.getTimestamp("responded_at");
        if (ra != null) r.setRespondedAt(ra.toLocalDateTime());
        Timestamp coa = rs.getTimestamp("completed_at");
        if (coa != null) r.setCompletedAt(coa.toLocalDateTime());
        // joined fields (may not be present in all queries)
        try { r.setRequesterName(rs.getString("requester_name")); } catch (SQLException ignored) {}
        try { r.setTaskName(rs.getString("task_name")); } catch (SQLException ignored) {}
        try { r.setCourseName(rs.getString("course_name")); } catch (SQLException ignored) {}
        return r;
    }
}
