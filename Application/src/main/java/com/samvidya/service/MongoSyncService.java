package com.samvidya.service;

import com.mongodb.client.MongoClient;
import com.mongodb.client.MongoClients;
import com.mongodb.client.MongoCollection;
import com.mongodb.client.MongoDatabase;
import com.mongodb.client.model.ReplaceOptions;
import com.samvidya.dao.AnalyticsDAO;
import com.samvidya.model.Course;
import com.samvidya.util.DatabaseUtil;
import io.github.cdimascio.dotenv.Dotenv;
import org.bson.Document;

import java.sql.*;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;

/**
 * Collects all analytics data for a course from MySQL and pushes it to MongoDB.
 *
 * MongoDB document structure (collection: course_analytics, keyed by courseId):
 * {
 *   courseId, courseCode, courseName, subject, instructorName, syncedAt,
 *   averages: { avgTasks, avgModules, avgQuestions, avgPtsTask, avgPtsModule,
 *               avgPtsQuestion, avgPtsCourse, avgAttempts, courseTestPassRate },
 *   moduleFunnel: [ { moduleName, studentsReached } ],
 *   taskPassRates: [ { taskName, passRate } ],
 *   leaderboards: {
 *     tasksCompleted, perfectTasks, questionsCompleted, perfectQuestions,
 *     mostPoints, mostPeerHelps, mostPeerHelpPoints
 *     — each: [ { rank, name, section, value } ]
 *   },
 *   students: [
 *     { studentId, fullName, section, enrollmentNumber, email,
 *       totalCoursePoints, modulesCompleted, totalModules,
 *       courseTestCompleted, courseTestPassed, courseTestScore, courseTestMaxScore,
 *       peerHelpsGiven, peerHelpPointsEarned,
 *       moduleProgress: [
 *         { moduleId, moduleName, moduleOrder, status,
 *           tasksPassedCount, minTasksRequired,
 *           moduleTestPassed, moduleTestScore, moduleTestMaxScore,
 *           pointsEarned }
 *       ]
 *     }
 *   ]
 * }
 */
public class MongoSyncService {

    private static final Dotenv dotenv = Dotenv.configure().ignoreIfMissing().load();
    private static final String MONGO_URI = dotenv.get("MONGODB_URI",
            "mongodb+srv://yaksh2912:2912yaksh@cluster0.bqturd5.mongodb.net/?appName=Cluster02912yaksh");
    private static final String MONGO_DB  = dotenv.get("MONGODB_DB_NAME", "samvidya_analytics");
    private static final String COLLECTION = "course_analytics";

    private final AnalyticsDAO analyticsDAO = new AnalyticsDAO();

    /**
     * Builds the full analytics document for the given course and upserts it into MongoDB.
     * This is a blocking call — run it on a background thread.
     *
     * @param course the course to sync
     * @throws Exception on any SQL or MongoDB error
     */
    public void syncCourse(Course course) throws Exception {
        long courseId = course.getId();

        Document doc = new Document();
        doc.append("courseId",       courseId);
        doc.append("courseCode",     course.getCourseCode());
        doc.append("courseName",     course.getCourseName());
        doc.append("subject",        course.getSubject());
        doc.append("instructorName", course.getInstructorName());
        doc.append("syncedAt",       LocalDateTime.now().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME));

        // ── Averages ──────────────────────────────────────────────────────────
        Document averages = new Document()
                .append("avgTasksCompleted",   analyticsDAO.getAvgTasksCompleted(courseId))
                .append("avgModulesCompleted",  analyticsDAO.getAvgModulesCompleted(courseId))
                .append("avgQuestionsCompleted",analyticsDAO.getAvgQuestionsCompleted(courseId))
                .append("avgPointsPerTask",     analyticsDAO.getAvgPointsPerTask(courseId))
                .append("avgPointsPerModule",   analyticsDAO.getAvgPointsPerModule(courseId))
                .append("avgPointsPerQuestion", analyticsDAO.getAvgPointsPerQuestion(courseId))
                .append("avgPointsInCourse",    analyticsDAO.getAvgPointsInCourse(courseId))
                .append("avgAttemptsPerTask",   analyticsDAO.getAvgAttemptsPerTask(courseId))
                .append("courseTestPassRate",   analyticsDAO.getCourseTestPassRate(courseId));
        doc.append("averages", averages);

        // ── Module funnel ─────────────────────────────────────────────────────
        List<Document> funnelList = new ArrayList<>();
        analyticsDAO.getModuleFunnel(courseId).forEach((name, count) ->
                funnelList.add(new Document("moduleName", name).append("studentsReached", count)));
        doc.append("moduleFunnel", funnelList);

        // ── Task pass rates ───────────────────────────────────────────────────
        List<Document> taskRateList = new ArrayList<>();
        analyticsDAO.getTaskPassRates(courseId).forEach((name, rate) ->
                taskRateList.add(new Document("taskName", name).append("passRate", rate)));
        doc.append("taskPassRates", taskRateList);

        // ── Leaderboards ──────────────────────────────────────────────────────
        Document leaderboards = new Document()
                .append("tasksCompleted",    toLeaderboardDocs(analyticsDAO.getLeaderboardTasksCompleted(courseId, null)))
                .append("perfectTasks",      toLeaderboardDocs(analyticsDAO.getLeaderboardPerfectTasks(courseId, null)))
                .append("questionsCompleted",toLeaderboardDocs(analyticsDAO.getLeaderboardQuestionsCompleted(courseId, null)))
                .append("perfectQuestions",  toLeaderboardDocs(analyticsDAO.getLeaderboardPerfectQuestions(courseId, null)))
                .append("mostPoints",        toLeaderboardDocs(analyticsDAO.getLeaderboardMostPoints(courseId, null)))
                .append("mostPeerHelps",     toLeaderboardDocs(analyticsDAO.getLeaderboardMostPeerHelps(courseId, null)))
                .append("mostPeerHelpPoints",toLeaderboardDocs(analyticsDAO.getLeaderboardMostPeerHelpPoints(courseId, null)));
        doc.append("leaderboards", leaderboards);

        // ── Per-student data ──────────────────────────────────────────────────
        doc.append("students", buildStudentDocs(courseId));

        // ── Upsert into MongoDB ───────────────────────────────────────────────
        try (MongoClient client = MongoClients.create(MONGO_URI)) {
            MongoDatabase db = client.getDatabase(MONGO_DB);
            MongoCollection<Document> col = db.getCollection(COLLECTION);
            Document filter = new Document("courseId", courseId);
            col.replaceOne(filter, doc, new ReplaceOptions().upsert(true));
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Helpers
    // ─────────────────────────────────────────────────────────────────────────

    /** Convert leaderboard rows {rank, name, section, value} to BSON documents. */
    private List<Document> toLeaderboardDocs(List<String[]> rows) {
        List<Document> docs = new ArrayList<>();
        for (String[] row : rows) {
            docs.add(new Document()
                    .append("rank",    Integer.parseInt(row[0]))
                    .append("name",    row[1])
                    .append("section", row[2])
                    .append("value",   parseLong(row[3])));
        }
        return docs;
    }

    /**
     * Builds per-student documents for all students enrolled in the course.
     * Each document contains:
     *  - basic info (id, name, section, enrollment number, email)
     *  - course-level progress (total points, modules completed, course test result, peer help)
     *  - per-module progress (status, tasks passed, module test result, points earned in module)
     */
    private List<Document> buildStudentDocs(long courseId) throws SQLException {
        List<Document> studentDocs = new ArrayList<>();

        // Fetch all enrolled students with their course-level progress
        String sql =
            "SELECT u.id, u.full_name, u.section, u.enrollment_number, u.email," +
            "       scp.modules_completed, scp.total_modules, scp.total_course_points," +
            "       scp.course_test_completed, scp.course_test_passed," +
            "       scp.course_test_score, scp.course_test_max_score," +
            "       scp.peer_helps_given, scp.peer_help_points_earned" +
            " FROM student_enrollments se" +
            " JOIN users u ON se.student_id = u.id" +
            " LEFT JOIN student_course_progress scp" +
            "       ON scp.student_id = u.id AND scp.course_id = se.course_id" +
            " WHERE se.course_id = ? AND se.is_active = TRUE" +
            " ORDER BY u.full_name";

        try (Connection conn = DatabaseUtil.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setLong(1, courseId);
            ResultSet rs = stmt.executeQuery();
            while (rs.next()) {
                long studentId = rs.getLong("id");
                Document sd = new Document()
                        .append("studentId",          studentId)
                        .append("fullName",            rs.getString("full_name"))
                        .append("section",             rs.getString("section"))
                        .append("enrollmentNumber",    rs.getString("enrollment_number"))
                        .append("email",               rs.getString("email"))
                        .append("modulesCompleted",    rs.getInt("modules_completed"))
                        .append("totalModules",        rs.getInt("total_modules"))
                        .append("totalCoursePoints",   rs.getInt("total_course_points"))
                        .append("courseTestCompleted", rs.getBoolean("course_test_completed"))
                        .append("courseTestPassed",    rs.getBoolean("course_test_passed"))
                        .append("courseTestScore",     rs.getInt("course_test_score"))
                        .append("courseTestMaxScore",  rs.getInt("course_test_max_score"))
                        .append("peerHelpsGiven",      rs.getInt("peer_helps_given"))
                        .append("peerHelpPointsEarned",rs.getInt("peer_help_points_earned"))
                        .append("moduleProgress",      buildModuleProgressDocs(studentId, courseId));
                studentDocs.add(sd);
            }
        }
        return studentDocs;
    }

    /**
     * Builds per-module progress documents for one student in one course.
     * Also computes pointsEarned per module (sum of best task + module-test scores).
     */
    private List<Document> buildModuleProgressDocs(long studentId, long courseId) throws SQLException {
        List<Document> moduleDocs = new ArrayList<>();

        String sql =
            "SELECT m.id AS module_id, m.module_name, m.module_order," +
            "       sp.module_status, sp.tasks_passed_count, sp.min_tasks_required," +
            "       sp.module_test_passed, sp.module_test_score, sp.module_test_max_score," +
            "       COALESCE((" +
            "           SELECT SUM(sa.score)" +
            "           FROM student_attempts sa" +
            "           WHERE sa.student_id = sp.student_id" +
            "             AND sa.module_id = m.id" +
            "             AND sa.is_latest = TRUE" +
            "       ), 0) AS points_earned" +
            " FROM modules m" +
            " LEFT JOIN student_progress sp" +
            "       ON sp.module_id = m.id AND sp.student_id = ? AND sp.course_id = ?" +
            " WHERE m.course_id = ? AND m.is_active = TRUE" +
            " ORDER BY m.module_order";

        try (Connection conn = DatabaseUtil.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setLong(1, studentId);
            stmt.setLong(2, courseId);
            stmt.setLong(3, courseId);
            ResultSet rs = stmt.executeQuery();
            while (rs.next()) {
                String status = rs.getString("module_status");
                moduleDocs.add(new Document()
                        .append("moduleId",          rs.getLong("module_id"))
                        .append("moduleName",         rs.getString("module_name"))
                        .append("moduleOrder",        rs.getInt("module_order"))
                        .append("status",             status != null ? status : "NOT_STARTED")
                        .append("tasksPassedCount",   rs.getInt("tasks_passed_count"))
                        .append("minTasksRequired",   rs.getInt("min_tasks_required"))
                        .append("moduleTestPassed",   rs.getBoolean("module_test_passed"))
                        .append("moduleTestScore",    rs.getInt("module_test_score"))
                        .append("moduleTestMaxScore", rs.getInt("module_test_max_score"))
                        .append("pointsEarned",       rs.getInt("points_earned")));
            }
        }
        return moduleDocs;
    }

    private long parseLong(String s) {
        try { return Long.parseLong(s); } catch (NumberFormatException e) { return 0L; }
    }
}
