package com.samvidya.dao;

import com.samvidya.model.ShopItem;
import com.samvidya.model.ShopPurchase;
import com.samvidya.util.DatabaseUtil;

import java.sql.*;
import java.util.ArrayList;
import java.util.List;

public class ShopDAO {

    // ── Items ─────────────────────────────────────────────────────────────────

    public List<ShopItem> findItemsByCourse(long courseId) throws SQLException {
        String sql = "SELECT * FROM course_shop_items WHERE course_id = ? ORDER BY name";
        List<ShopItem> items = new ArrayList<>();
        try (Connection conn = DatabaseUtil.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setLong(1, courseId);
            ResultSet rs = stmt.executeQuery();
            while (rs.next()) items.add(mapItem(rs));
        }
        return items;
    }

    public List<ShopItem> findActiveItemsByCourse(long courseId) throws SQLException {
        String sql = "SELECT * FROM course_shop_items WHERE course_id = ? AND is_active = TRUE ORDER BY name";
        List<ShopItem> items = new ArrayList<>();
        try (Connection conn = DatabaseUtil.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setLong(1, courseId);
            ResultSet rs = stmt.executeQuery();
            while (rs.next()) items.add(mapItem(rs));
        }
        return items;
    }

    public ShopItem findItemById(long itemId) throws SQLException {
        String sql = "SELECT * FROM course_shop_items WHERE id = ?";
        try (Connection conn = DatabaseUtil.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setLong(1, itemId);
            ResultSet rs = stmt.executeQuery();
            if (rs.next()) return mapItem(rs);
        }
        return null;
    }

    public long saveItem(ShopItem item) throws SQLException {
        if (item.getId() == null) return insertItem(item);
        updateItem(item);
        return item.getId();
    }

    private long insertItem(ShopItem item) throws SQLException {
        String sql = "INSERT INTO course_shop_items (course_id, name, description, point_cost, max_qty_per_student, is_active) " +
                     "VALUES (?, ?, ?, ?, ?, ?)";
        try (Connection conn = DatabaseUtil.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql, Statement.RETURN_GENERATED_KEYS)) {
            stmt.setLong(1, item.getCourseId());
            stmt.setString(2, item.getName());
            stmt.setString(3, item.getDescription());
            stmt.setInt(4, item.getPointCost());
            stmt.setInt(5, item.getMaxQtyPerStudent());
            stmt.setBoolean(6, item.isActive());
            stmt.executeUpdate();
            try (ResultSet rs = stmt.getGeneratedKeys()) {
                if (rs.next()) { item.setId(rs.getLong(1)); return item.getId(); }
            }
        }
        throw new SQLException("Insert shop item failed");
    }

    private void updateItem(ShopItem item) throws SQLException {
        String sql = "UPDATE course_shop_items SET name=?, description=?, point_cost=?, " +
                     "max_qty_per_student=?, is_active=? WHERE id=?";
        try (Connection conn = DatabaseUtil.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setString(1, item.getName());
            stmt.setString(2, item.getDescription());
            stmt.setInt(3, item.getPointCost());
            stmt.setInt(4, item.getMaxQtyPerStudent());
            stmt.setBoolean(5, item.isActive());
            stmt.setLong(6, item.getId());
            stmt.executeUpdate();
        }
    }

    public void deleteItem(long itemId) throws SQLException {
        String sql = "DELETE FROM course_shop_items WHERE id = ?";
        try (Connection conn = DatabaseUtil.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setLong(1, itemId);
            stmt.executeUpdate();
        }
    }

    /** Seed the default "1 Mark" item for a newly created course. */
    public void seedDefaultItems(long courseId) throws SQLException {
        String sql = "INSERT INTO course_shop_items (course_id, name, description, point_cost, max_qty_per_student, is_active) " +
                     "VALUES (?, '1 Mark', 'Redeem 5 course points for 1 mark of extra credit. Max 10 per student.', 5, 10, TRUE)";
        try (Connection conn = DatabaseUtil.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setLong(1, courseId);
            stmt.executeUpdate();
        }
    }

    // ── Purchases ─────────────────────────────────────────────────────────────

    /** Total points spent by a student in a course. */
    public int getTotalPointsSpent(long studentId, long courseId) throws SQLException {
        String sql = "SELECT COALESCE(SUM(points_spent), 0) FROM student_shop_purchases " +
                     "WHERE student_id = ? AND course_id = ?";
        try (Connection conn = DatabaseUtil.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setLong(1, studentId);
            stmt.setLong(2, courseId);
            ResultSet rs = stmt.executeQuery();
            return rs.next() ? rs.getInt(1) : 0;
        }
    }

    /** Total quantity of a specific item purchased by a student. */
    public int getStudentItemQty(long studentId, long itemId) throws SQLException {
        String sql = "SELECT COALESCE(SUM(quantity), 0) FROM student_shop_purchases " +
                     "WHERE student_id = ? AND item_id = ?";
        try (Connection conn = DatabaseUtil.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setLong(1, studentId);
            stmt.setLong(2, itemId);
            ResultSet rs = stmt.executeQuery();
            return rs.next() ? rs.getInt(1) : 0;
        }
    }

    /** Record a purchase. Returns the new purchase id. */
    public long purchase(long studentId, long courseId, long itemId, int quantity, int pointsSpent) throws SQLException {
        String sql = "INSERT INTO student_shop_purchases (student_id, course_id, item_id, quantity, points_spent) " +
                     "VALUES (?, ?, ?, ?, ?)";
        try (Connection conn = DatabaseUtil.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql, Statement.RETURN_GENERATED_KEYS)) {
            stmt.setLong(1, studentId);
            stmt.setLong(2, courseId);
            stmt.setLong(3, itemId);
            stmt.setInt(4, quantity);
            stmt.setInt(5, pointsSpent);
            stmt.executeUpdate();
            try (ResultSet rs = stmt.getGeneratedKeys()) {
                if (rs.next()) return rs.getLong(1);
            }
        }
        throw new SQLException("Purchase insert failed");
    }

    /** Full purchase history for a student in a course, newest first. */
    public List<ShopPurchase> getPurchaseHistory(long studentId, long courseId) throws SQLException {
        String sql = "SELECT p.*, i.name AS item_name FROM student_shop_purchases p " +
                     "JOIN course_shop_items i ON p.item_id = i.id " +
                     "WHERE p.student_id = ? AND p.course_id = ? ORDER BY p.purchased_at DESC";
        List<ShopPurchase> list = new ArrayList<>();
        try (Connection conn = DatabaseUtil.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setLong(1, studentId);
            stmt.setLong(2, courseId);
            ResultSet rs = stmt.executeQuery();
            while (rs.next()) list.add(mapPurchase(rs));
        }
        return list;
    }

    /** Per-item purchase summary for instructor analytics: item_name, total_qty, total_points. */
    public List<String[]> getItemSummaryForCourse(long courseId) throws SQLException {
        String sql = "SELECT i.name, COALESCE(SUM(p.quantity),0) AS total_qty, " +
                     "COALESCE(SUM(p.points_spent),0) AS total_pts " +
                     "FROM course_shop_items i " +
                     "LEFT JOIN student_shop_purchases p ON i.id = p.item_id " +
                     "WHERE i.course_id = ? GROUP BY i.id, i.name ORDER BY i.name";
        List<String[]> rows = new ArrayList<>();
        try (Connection conn = DatabaseUtil.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setLong(1, courseId);
            ResultSet rs = stmt.executeQuery();
            while (rs.next()) rows.add(new String[]{rs.getString(1), rs.getString(2), rs.getString(3)});
        }
        return rows;
    }

    // ── Mappers ───────────────────────────────────────────────────────────────

    private ShopItem mapItem(ResultSet rs) throws SQLException {
        ShopItem i = new ShopItem();
        i.setId(rs.getLong("id"));
        i.setCourseId(rs.getLong("course_id"));
        i.setName(rs.getString("name"));
        i.setDescription(rs.getString("description"));
        i.setPointCost(rs.getInt("point_cost"));
        i.setMaxQtyPerStudent(rs.getInt("max_qty_per_student"));
        i.setActive(rs.getBoolean("is_active"));
        Timestamp ca = rs.getTimestamp("created_at");
        if (ca != null) i.setCreatedAt(ca.toLocalDateTime());
        Timestamp ua = rs.getTimestamp("updated_at");
        if (ua != null) i.setUpdatedAt(ua.toLocalDateTime());
        return i;
    }

    private ShopPurchase mapPurchase(ResultSet rs) throws SQLException {
        ShopPurchase p = new ShopPurchase();
        p.setId(rs.getLong("id"));
        p.setStudentId(rs.getLong("student_id"));
        p.setCourseId(rs.getLong("course_id"));
        p.setItemId(rs.getLong("item_id"));
        p.setQuantity(rs.getInt("quantity"));
        p.setPointsSpent(rs.getInt("points_spent"));
        Timestamp pa = rs.getTimestamp("purchased_at");
        if (pa != null) p.setPurchasedAt(pa.toLocalDateTime());
        try { p.setItemName(rs.getString("item_name")); } catch (SQLException ignored) {}
        try { p.setStudentName(rs.getString("student_name")); } catch (SQLException ignored) {}
        return p;
    }
}
