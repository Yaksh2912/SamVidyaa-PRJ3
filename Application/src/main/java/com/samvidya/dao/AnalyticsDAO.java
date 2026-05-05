package com.samvidya.dao;

import com.samvidya.util.DatabaseUtil;

import java.sql.*;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * DAO for all analytics and leaderboard queries.
 * All data is computed live from student_attempts, student_progress, and student_course_progress.
 */
public class AnalyticsDAO {

    // -------------------------------------------------------------------------
    // Course-level averages
    // -------------------------------------------------------------------------

    /** Avg tasks completed (passed) per enrolled student */
    public double getAvgTasksCompleted(long courseId) throws SQLException {
        String sql =
            "SELECT AVG(tasks_passed) FROM (" +
            "  SELECT student_id, COUNT(DISTINCT task_id) AS tasks_passed" +
            "  FROM student_attempts" +
            "  WHERE course_id = ? AND attempt_type = 'TASK' AND is_latest = TRUE" +
            "    AND score >= max_score * 0.5" +
            "  GROUP BY student_id" +
            ") t";
        return queryDouble(sql, courseId);
    }

    /** Avg modules completed per enrolled student */
    public double getAvgModulesCompleted(long courseId) throws SQLException {
        String sql =
            "SELECT AVG(modules_completed) FROM student_course_progress WHERE course_id = ?";
        return queryDouble(sql, courseId);
    }

    /** Avg questions completed (attempted) per enrolled student */
    public double getAvgQuestionsCompleted(long courseId) throws SQLException {
        String sql =
            "SELECT AVG(q_count) FROM (" +
            "  SELECT student_id, COUNT(DISTINCT question_id) AS q_count" +
            "  FROM student_attempts" +
            "  WHERE course_id = ? AND attempt_type IN ('MODULE_TEST','COURSE_TEST') AND is_latest = TRUE" +
            "  GROUP BY student_id" +
            ") t";
        return queryDouble(sql, courseId);
    }

    /** Avg score per task attempt (latest only) */
    public double getAvgPointsPerTask(long courseId) throws SQLException {
        String sql =
            "SELECT AVG(score) FROM student_attempts" +
            " WHERE course_id = ? AND attempt_type = 'TASK' AND is_latest = TRUE";
        return queryDouble(sql, courseId);
    }

    /** Avg points earned per module (sum of task + module-test scores per student per module, then avg) */
    public double getAvgPointsPerModule(long courseId) throws SQLException {
        String sql =
            "SELECT AVG(module_pts) FROM (" +
            "  SELECT student_id, module_id, SUM(score) AS module_pts" +
            "  FROM student_attempts" +
            "  WHERE course_id = ? AND module_id IS NOT NULL AND is_latest = TRUE" +
            "  GROUP BY student_id, module_id" +
            ") t";
        return queryDouble(sql, courseId);
    }

    /** Avg score per question attempt (latest only) */
    public double getAvgPointsPerQuestion(long courseId) throws SQLException {
        String sql =
            "SELECT AVG(score) FROM student_attempts" +
            " WHERE course_id = ? AND attempt_type IN ('MODULE_TEST','COURSE_TEST') AND is_latest = TRUE";
        return queryDouble(sql, courseId);
    }

    /** Avg total course points per enrolled student */
    public double getAvgPointsInCourse(long courseId) throws SQLException {
        String sql =
            "SELECT AVG(total_course_points) FROM student_course_progress WHERE course_id = ?";
        return queryDouble(sql, courseId);
    }

    // -------------------------------------------------------------------------
    // Extra analytics
    // -------------------------------------------------------------------------

    /** Pass rate per task: task_id -> pass_percentage */
    public Map<String, Double> getTaskPassRates(long courseId) throws SQLException {
        String sql =
            "SELECT t.task_name," +
            "  ROUND(100.0 * SUM(CASE WHEN sa.score >= sa.max_score * 0.5 THEN 1 ELSE 0 END) / COUNT(*), 1) AS pass_pct" +
            " FROM student_attempts sa" +
            " JOIN tasks t ON sa.task_id = t.id" +
            " WHERE sa.course_id = ? AND sa.attempt_type = 'TASK' AND sa.is_latest = TRUE" +
            " GROUP BY sa.task_id, t.task_name" +
            " ORDER BY pass_pct DESC";
        return queryStringDoubleMap(sql, courseId);
    }

    /** Module completion funnel: module_name -> students_reached */
    public Map<String, Integer> getModuleFunnel(long courseId) throws SQLException {
        String sql =
            "SELECT m.module_name, COUNT(DISTINCT sp.student_id) AS reached" +
            " FROM student_progress sp" +
            " JOIN modules m ON sp.module_id = m.id" +
            " WHERE sp.course_id = ? AND sp.module_status != 'NOT_STARTED'" +
            " GROUP BY m.module_order, m.module_name" +
            " ORDER BY m.module_order";
        return queryStringIntMap(sql, courseId);
    }

    /** Avg attempts per task (shows difficulty) */
    public double getAvgAttemptsPerTask(long courseId) throws SQLException {
        String sql =
            "SELECT AVG(attempts) FROM (" +
            "  SELECT student_id, task_id, MAX(attempt_number) AS attempts" +
            "  FROM student_attempts" +
            "  WHERE course_id = ? AND attempt_type = 'TASK'" +
            "  GROUP BY student_id, task_id" +
            ") t";
        return queryDouble(sql, courseId);
    }

    /** Course test pass rate */
    public double getCourseTestPassRate(long courseId) throws SQLException {
        String sql =
            "SELECT ROUND(100.0 * SUM(CASE WHEN course_test_passed THEN 1 ELSE 0 END) / COUNT(*), 1)" +
            " FROM student_course_progress WHERE course_id = ? AND course_test_completed = TRUE";
        return queryDouble(sql, courseId);
    }

    // -------------------------------------------------------------------------
    // Leaderboards — each returns List<String[]> {rank, name, section, value}
    // Optional sectionFilter: null or empty = all sections
    // -------------------------------------------------------------------------

    public List<String[]> getLeaderboardTasksCompleted(long courseId, String sectionFilter) throws SQLException {
        String sql =
            "SELECT u.full_name, COALESCE(u.section,'—') AS section," +
            "  COUNT(DISTINCT sa.task_id) AS val" +
            " FROM student_attempts sa" +
            " JOIN users u ON sa.student_id = u.id" +
            " WHERE sa.course_id = ? AND sa.attempt_type = 'TASK' AND sa.is_latest = TRUE" +
            "   AND sa.score >= sa.max_score * 0.5" +
            (sectionFilter != null && !sectionFilter.isEmpty() ? " AND u.section = ?" : "") +
            " GROUP BY sa.student_id, u.full_name, u.section" +
            " ORDER BY val DESC";
        return queryLeaderboard(sql, courseId, sectionFilter);
    }

    public List<String[]> getLeaderboardPerfectTasks(long courseId, String sectionFilter) throws SQLException {
        String sql =
            "SELECT u.full_name, COALESCE(u.section,'—') AS section," +
            "  COUNT(DISTINCT sa.task_id) AS val" +
            " FROM student_attempts sa" +
            " JOIN users u ON sa.student_id = u.id" +
            " WHERE sa.course_id = ? AND sa.attempt_type = 'TASK' AND sa.is_latest = TRUE" +
            "   AND sa.score = sa.max_score AND sa.max_score > 0" +
            (sectionFilter != null && !sectionFilter.isEmpty() ? " AND u.section = ?" : "") +
            " GROUP BY sa.student_id, u.full_name, u.section" +
            " ORDER BY val DESC";
        return queryLeaderboard(sql, courseId, sectionFilter);
    }

    public List<String[]> getLeaderboardQuestionsCompleted(long courseId, String sectionFilter) throws SQLException {
        String sql =
            "SELECT u.full_name, COALESCE(u.section,'—') AS section," +
            "  COUNT(DISTINCT sa.question_id) AS val" +
            " FROM student_attempts sa" +
            " JOIN users u ON sa.student_id = u.id" +
            " WHERE sa.course_id = ? AND sa.attempt_type IN ('MODULE_TEST','COURSE_TEST') AND sa.is_latest = TRUE" +
            (sectionFilter != null && !sectionFilter.isEmpty() ? " AND u.section = ?" : "") +
            " GROUP BY sa.student_id, u.full_name, u.section" +
            " ORDER BY val DESC";
        return queryLeaderboard(sql, courseId, sectionFilter);
    }

    public List<String[]> getLeaderboardPerfectQuestions(long courseId, String sectionFilter) throws SQLException {
        String sql =
            "SELECT u.full_name, COALESCE(u.section,'—') AS section," +
            "  COUNT(DISTINCT sa.question_id) AS val" +
            " FROM student_attempts sa" +
            " JOIN users u ON sa.student_id = u.id" +
            " WHERE sa.course_id = ? AND sa.attempt_type IN ('MODULE_TEST','COURSE_TEST') AND sa.is_latest = TRUE" +
            "   AND sa.score = sa.max_score AND sa.max_score > 0" +
            (sectionFilter != null && !sectionFilter.isEmpty() ? " AND u.section = ?" : "") +
            " GROUP BY sa.student_id, u.full_name, u.section" +
            " ORDER BY val DESC";
        return queryLeaderboard(sql, courseId, sectionFilter);
    }

    public List<String[]> getLeaderboardMostPoints(long courseId, String sectionFilter) throws SQLException {
        String sql =
            "SELECT u.full_name, COALESCE(u.section,'—') AS section," +
            "  scp.total_course_points AS val" +
            " FROM student_course_progress scp" +
            " JOIN users u ON scp.student_id = u.id" +
            " WHERE scp.course_id = ?" +
            (sectionFilter != null && !sectionFilter.isEmpty() ? " AND u.section = ?" : "") +
            " ORDER BY val DESC";
        return queryLeaderboard(sql, courseId, sectionFilter);
    }

    public List<String[]> getLeaderboardMostPeerHelps(long courseId, String sectionFilter) throws SQLException {
        String sql =
            "SELECT u.full_name, COALESCE(u.section,'—') AS section," +
            "  scp.peer_helps_given AS val" +
            " FROM student_course_progress scp" +
            " JOIN users u ON scp.student_id = u.id" +
            " WHERE scp.course_id = ? AND scp.peer_helps_given > 0" +
            (sectionFilter != null && !sectionFilter.isEmpty() ? " AND u.section = ?" : "") +
            " ORDER BY val DESC";
        return queryLeaderboard(sql, courseId, sectionFilter);
    }

    public List<String[]> getLeaderboardMostPeerHelpPoints(long courseId, String sectionFilter) throws SQLException {
        String sql =
            "SELECT u.full_name, COALESCE(u.section,'—') AS section," +
            "  scp.peer_help_points_earned AS val" +
            " FROM student_course_progress scp" +
            " JOIN users u ON scp.student_id = u.id" +
            " WHERE scp.course_id = ? AND scp.peer_help_points_earned > 0" +
            (sectionFilter != null && !sectionFilter.isEmpty() ? " AND u.section = ?" : "") +
            " ORDER BY val DESC";
        return queryLeaderboard(sql, courseId, sectionFilter);
    }

    /** Returns distinct non-null sections for students enrolled in a course */
    public List<String> getDistinctSections(long courseId) throws SQLException {
        String sql =
            "SELECT DISTINCT u.section FROM student_course_progress scp" +
            " JOIN users u ON scp.student_id = u.id" +
            " WHERE scp.course_id = ? AND u.section IS NOT NULL AND u.section != ''" +
            " ORDER BY u.section";
        List<String> sections = new ArrayList<>();
        try (Connection conn = DatabaseUtil.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setLong(1, courseId);
            ResultSet rs = stmt.executeQuery();
            while (rs.next()) sections.add(rs.getString(1));
        }
        return sections;
    }

    // -------------------------------------------------------------------------
    // Helpers
    // -------------------------------------------------------------------------

    private double queryDouble(String sql, long courseId) throws SQLException {
        try (Connection conn = DatabaseUtil.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setLong(1, courseId);
            ResultSet rs = stmt.executeQuery();
            if (rs.next()) {
                double v = rs.getDouble(1);
                return rs.wasNull() ? 0.0 : v;
            }
            return 0.0;
        }
    }

    private Map<String, Double> queryStringDoubleMap(String sql, long courseId) throws SQLException {
        Map<String, Double> map = new LinkedHashMap<>();
        try (Connection conn = DatabaseUtil.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setLong(1, courseId);
            ResultSet rs = stmt.executeQuery();
            while (rs.next()) map.put(rs.getString(1), rs.getDouble(2));
        }
        return map;
    }

    private Map<String, Integer> queryStringIntMap(String sql, long courseId) throws SQLException {
        Map<String, Integer> map = new LinkedHashMap<>();
        try (Connection conn = DatabaseUtil.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setLong(1, courseId);
            ResultSet rs = stmt.executeQuery();
            while (rs.next()) map.put(rs.getString(1), rs.getInt(2));
        }
        return map;
    }

    /** Returns rows as {rank, name, section, value} */
    private List<String[]> queryLeaderboard(String sql, long courseId, String sectionFilter) throws SQLException {
        List<String[]> rows = new ArrayList<>();
        try (Connection conn = DatabaseUtil.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setLong(1, courseId);
            if (sectionFilter != null && !sectionFilter.isEmpty()) {
                stmt.setString(2, sectionFilter);
            }
            ResultSet rs = stmt.executeQuery();
            int rank = 1;
            while (rs.next()) {
                rows.add(new String[]{
                    String.valueOf(rank++),
                    rs.getString(1),
                    rs.getString(2),
                    String.valueOf(rs.getLong(3))
                });
            }
        }
        return rows;
    }
}
