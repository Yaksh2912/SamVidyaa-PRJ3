package com.samvidya.service;

import com.mongodb.client.MongoClient;
import com.mongodb.client.MongoClients;
import com.mongodb.client.MongoCollection;
import com.mongodb.client.MongoDatabase;
import com.mongodb.client.model.ReplaceOptions;
import com.samvidya.util.DatabaseUtil;
import io.github.cdimascio.dotenv.Dotenv;
import org.bson.Document;

import java.sql.*;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;

/**
 * Syncs all users (except passwords) to two MongoDB collections:
 *
 *  trusted_users  — ADMIN and INSTRUCTOR accounts
 *  students       — STUDENT accounts
 *
 * Each document is upserted by userId so repeated syncs are safe.
 *
 * Fields pushed (no password / password_hash):
 *   userId, username, fullName, email, role, institution, section,
 *   enrollmentNumber (students only), totalPoints, createdAt, lastLogin, syncedAt
 */
public class UserSyncService {

    private static final Dotenv dotenv = Dotenv.configure().ignoreIfMissing().load();
    private static final String MONGO_URI = dotenv.get("MONGODB_URI",
            "mongodb+srv://yaksh2912:2912yaksh@cluster0.bqturd5.mongodb.net/?appName=Cluster02912yaksh");
    private static final String MONGO_DB        = dotenv.get("MONGODB_DB_NAME", "samvidya_analytics");
    private static final String COL_TRUSTED     = "trusted_users";
    private static final String COL_STUDENTS    = "students";

    /**
     * Fetches all users from MySQL and upserts them into MongoDB.
     * Blocking — call from a background thread.
     *
     * @return SyncResult with counts of trusted users and students synced
     */
    public SyncResult syncAllUsers() throws Exception {
        List<Document> trustedDocs = new ArrayList<>();
        List<Document> studentDocs = new ArrayList<>();

        String sql =
            "SELECT id, username, full_name, email, role, institution, section," +
            "       enrollment_number, total_points, created_at, last_login" +
            " FROM users" +
            " ORDER BY role, full_name";

        try (Connection conn = DatabaseUtil.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql);
             ResultSet rs = stmt.executeQuery()) {

            String syncedAt = LocalDateTime.now().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME);

            while (rs.next()) {
                String role = rs.getString("role");
                Document doc = new Document()
                        .append("userId",           rs.getLong("id"))
                        .append("username",          rs.getString("username"))
                        .append("fullName",          rs.getString("full_name"))
                        .append("email",             rs.getString("email"))
                        .append("role",              role)
                        .append("institution",       rs.getString("institution"))
                        .append("section",           rs.getString("section"))
                        .append("totalPoints",       rs.getInt("total_points"))
                        .append("syncedAt",          syncedAt);

                // createdAt
                Timestamp createdAt = rs.getTimestamp("created_at");
                doc.append("createdAt", createdAt != null ? createdAt.toLocalDateTime()
                        .format(DateTimeFormatter.ISO_LOCAL_DATE_TIME) : null);

                // lastLogin
                Timestamp lastLogin = rs.getTimestamp("last_login");
                doc.append("lastLogin", lastLogin != null ? lastLogin.toLocalDateTime()
                        .format(DateTimeFormatter.ISO_LOCAL_DATE_TIME) : null);

                if ("STUDENT".equals(role)) {
                    doc.append("enrollmentNumber", rs.getString("enrollment_number"));
                    studentDocs.add(doc);
                } else {
                    // ADMIN or INSTRUCTOR
                    trustedDocs.add(doc);
                }
            }
        }

        // ── Push to MongoDB ───────────────────────────────────────────────────
        try (MongoClient client = MongoClients.create(MONGO_URI)) {
            MongoDatabase db = client.getDatabase(MONGO_DB);
            upsertAll(db.getCollection(COL_TRUSTED), trustedDocs, "userId");
            upsertAll(db.getCollection(COL_STUDENTS), studentDocs, "userId");
        }

        return new SyncResult(trustedDocs.size(), studentDocs.size());
    }

    /** Upsert each document in the list, keyed by the given field name. */
    private void upsertAll(MongoCollection<Document> col, List<Document> docs, String keyField) {
        ReplaceOptions opts = new ReplaceOptions().upsert(true);
        for (Document doc : docs) {
            Document filter = new Document(keyField, doc.get(keyField));
            col.replaceOne(filter, doc, opts);
        }
    }

    // ── Result DTO ────────────────────────────────────────────────────────────

    public static class SyncResult {
        public final int trustedCount;
        public final int studentCount;

        public SyncResult(int trustedCount, int studentCount) {
            this.trustedCount = trustedCount;
            this.studentCount = studentCount;
        }
    }
}
