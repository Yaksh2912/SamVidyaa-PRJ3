package com.samvidya.service;

import com.samvidya.dao.*;
import com.samvidya.model.*;
import com.samvidya.util.DatabaseUtil;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.SQLException;
import java.util.List;

public class StudentProgressService {
    
    private final StudentProgressDAO studentProgressDAO;
    private final StudentCourseProgressDAO studentCourseProgressDAO;
    private final StudentAttemptDAO studentAttemptDAO;
    private final ModuleDAO moduleDAO;
    private final CourseDAO courseDAO;

    public StudentProgressService() {
        this.studentProgressDAO = new StudentProgressDAO();
        this.studentCourseProgressDAO = new StudentCourseProgressDAO();
        this.studentAttemptDAO = new StudentAttemptDAO();
        this.moduleDAO = new ModuleDAO();
        this.courseDAO = new CourseDAO();
    }

    /**
     * Initialize student progress for a course
     */
    public StudentCourseProgress initializeCourseProgress(Long studentId, Long courseId) throws SQLException {
        // Get total modules in course
        List<com.samvidya.model.Module> modules = moduleDAO.findByCourseId(courseId);
        int totalModules = (int) modules.stream().filter(com.samvidya.model.Module::isActive).count();
        
        // Create or update course progress
        StudentCourseProgress courseProgress = studentCourseProgressDAO.createOrUpdate(studentId, courseId, totalModules);
        
        // Initialize module progress for all modules
        for (com.samvidya.model.Module module : modules) {
            if (module.isActive()) {
                studentProgressDAO.createOrUpdateProgress(studentId, courseId, module.getId());
            }
        }
        
        return courseProgress;
    }

    /**
     * Get student's course progress
     */
    public StudentCourseProgress getCourseProgress(Long studentId, Long courseId) throws SQLException {
        StudentCourseProgress progress = studentCourseProgressDAO.findByStudentAndCourse(studentId, courseId);
        if (progress == null) {
            progress = initializeCourseProgress(studentId, courseId);
        }
        return progress;
    }

    /**
     * Get student's module progress
     */
    public StudentProgress getModuleProgress(Long studentId, Long courseId, Long moduleId) throws SQLException {
        StudentProgress progress = studentProgressDAO.findByStudentCourseModule(studentId, courseId, moduleId);
        if (progress == null) {
            progress = studentProgressDAO.createOrUpdateProgress(studentId, courseId, moduleId);
        }
        return progress;
    }

    /**
     * Get all module progress for a student in a course
     */
    public List<StudentProgress> getAllModuleProgress(Long studentId, Long courseId) throws SQLException {
        return studentProgressDAO.findByStudentAndCourse(studentId, courseId);
    }

    /**
     * Check if student can access a specific module (sequential access)
     */
    public boolean canAccessModule(Long studentId, Long courseId, int moduleOrder) throws SQLException {
        StudentCourseProgress courseProgress = getCourseProgress(studentId, courseId);
        return courseProgress.canAccessModule(moduleOrder);
    }

    /**
     * Check if student can attempt module test
     */
    public boolean canAttemptModuleTest(Long studentId, Long courseId, Long moduleId) throws SQLException {
        StudentProgress progress = getModuleProgress(studentId, courseId, moduleId);
        return progress.isCanAttemptModuleTest() && !progress.isModuleTestPassed();
    }

    /**
     * Check if student can attempt course test
     */
    public boolean canAttemptCourseTest(Long studentId, Long courseId) throws SQLException {
        StudentCourseProgress courseProgress = getCourseProgress(studentId, courseId);
        return courseProgress.isCanAttemptCourseTest() && !courseProgress.isCourseTestCompleted();
    }

    /**
     * Update progression after task completion (called by trigger, but can be called manually)
     */
    public void updateProgression(Long studentId, Long courseId, Long moduleId) throws SQLException {
        try (Connection conn = DatabaseUtil.getConnection();
             PreparedStatement stmt = conn.prepareStatement("CALL UpdateStudentProgression(?, ?, ?)")) {
            
            stmt.setLong(1, studentId);
            stmt.setLong(2, courseId);
            stmt.setLong(3, moduleId);
            stmt.execute();
        }
    }

    /**
     * Get student's current accessible module
     */
    public com.samvidya.model.Module getCurrentAccessibleModule(Long studentId, Long courseId) throws SQLException {
        StudentCourseProgress courseProgress = getCourseProgress(studentId, courseId);
        int currentModuleOrder = courseProgress.getCurrentModuleOrder();
        
        List<com.samvidya.model.Module> modules = moduleDAO.findByCourseId(courseId);
        return modules.stream()
            .filter(m -> m.isActive() && m.getModuleOrder() == currentModuleOrder)
            .findFirst()
            .orElse(null);
    }

    /**
     * Get next module that student should work on
     */
    public com.samvidya.model.Module getNextModule(Long studentId, Long courseId) throws SQLException {
        List<StudentProgress> allProgress = getAllModuleProgress(studentId, courseId);
        List<com.samvidya.model.Module> modules = moduleDAO.findByCourseId(courseId);
        
        // Find first incomplete module in order
        for (com.samvidya.model.Module module : modules) {
            if (!module.isActive()) continue;
            
            StudentProgress progress = allProgress.stream()
                .filter(p -> p.getModuleId().equals(module.getId()))
                .findFirst()
                .orElse(null);
            
            if (progress == null || !"MODULE_COMPLETED".equals(progress.getModuleStatus())) {
                return module;
            }
        }
        
        return null; // All modules completed
    }

    /**
     * Get completion summary for a course
     */
    public CourseCompletionSummary getCourseCompletionSummary(Long studentId, Long courseId) throws SQLException {
        StudentCourseProgress courseProgress = getCourseProgress(studentId, courseId);
        List<StudentProgress> moduleProgressList = getAllModuleProgress(studentId, courseId);
        
        CourseCompletionSummary summary = new CourseCompletionSummary();
        summary.setStudentId(studentId);
        summary.setCourseId(courseId);
        summary.setTotalModules(courseProgress.getTotalModules());
        summary.setModulesCompleted(courseProgress.getModulesCompleted());
        summary.setCurrentModuleOrder(courseProgress.getCurrentModuleOrder());
        summary.setTotalCoursePoints(courseProgress.getTotalCoursePoints());
        summary.setCanAttemptCourseTest(courseProgress.isCanAttemptCourseTest());
        summary.setCourseTestCompleted(courseProgress.isCourseTestCompleted());
        summary.setCourseTestPassed(courseProgress.isCourseTestPassed());
        summary.setModuleProgressList(moduleProgressList);
        
        return summary;
    }

    /**
     * Update task completion (called after task submission)
     */
    public void updateTaskCompletion(Long studentId, Long courseId, Long moduleId, Long taskId, int score, int maxScore) throws SQLException {
        // The database trigger will automatically update progression when attempt is saved
        // This method can be used for manual updates if needed
        updateProgression(studentId, courseId, moduleId);
    }

    /**
     * Reset student progress for a course (for testing/admin purposes)
     */
    public void resetCourseProgress(Long studentId, Long courseId) throws SQLException {
        // Delete all attempts
        try (Connection conn = DatabaseUtil.getConnection()) {
            PreparedStatement stmt = conn.prepareStatement(
                "DELETE FROM student_attempts WHERE student_id = ? AND course_id = ?");
            stmt.setLong(1, studentId);
            stmt.setLong(2, courseId);
            stmt.executeUpdate();
            
            // Reset progress records
            stmt = conn.prepareStatement(
                "UPDATE student_progress SET " +
                "module_status = 'NOT_STARTED', tasks_passed_count = 0, " +
                "can_attempt_module_test = FALSE, module_test_score = 0, " +
                "module_test_passed = FALSE, updated_at = CURRENT_TIMESTAMP " +
                "WHERE student_id = ? AND course_id = ?");
            stmt.setLong(1, studentId);
            stmt.setLong(2, courseId);
            stmt.executeUpdate();
            
            // Reset course progress
            stmt = conn.prepareStatement(
                "UPDATE student_course_progress SET " +
                "current_module_order = 1, modules_completed = 0, " +
                "can_attempt_course_test = FALSE, course_test_completed = FALSE, " +
                "course_test_passed = FALSE, updated_at = CURRENT_TIMESTAMP " +
                "WHERE student_id = ? AND course_id = ?");
            stmt.setLong(1, studentId);
            stmt.setLong(2, courseId);
            stmt.executeUpdate();
        }
    }

    /**
     * Inner class for course completion summary
     */
    public static class CourseCompletionSummary {
        private Long studentId;
        private Long courseId;
        private int totalModules;
        private int modulesCompleted;
        private int currentModuleOrder;
        private int totalCoursePoints;
        private boolean canAttemptCourseTest;
        private boolean courseTestCompleted;
        private boolean courseTestPassed;
        private List<StudentProgress> moduleProgressList;

        // Getters and setters
        public Long getStudentId() { return studentId; }
        public void setStudentId(Long studentId) { this.studentId = studentId; }

        public Long getCourseId() { return courseId; }
        public void setCourseId(Long courseId) { this.courseId = courseId; }

        public int getTotalModules() { return totalModules; }
        public void setTotalModules(int totalModules) { this.totalModules = totalModules; }

        public int getModulesCompleted() { return modulesCompleted; }
        public void setModulesCompleted(int modulesCompleted) { this.modulesCompleted = modulesCompleted; }

        public int getCurrentModuleOrder() { return currentModuleOrder; }
        public void setCurrentModuleOrder(int currentModuleOrder) { this.currentModuleOrder = currentModuleOrder; }

        public int getTotalCoursePoints() { return totalCoursePoints; }
        public void setTotalCoursePoints(int totalCoursePoints) { this.totalCoursePoints = totalCoursePoints; }

        public boolean isCanAttemptCourseTest() { return canAttemptCourseTest; }
        public void setCanAttemptCourseTest(boolean canAttemptCourseTest) { this.canAttemptCourseTest = canAttemptCourseTest; }

        public boolean isCourseTestCompleted() { return courseTestCompleted; }
        public void setCourseTestCompleted(boolean courseTestCompleted) { this.courseTestCompleted = courseTestCompleted; }

        public boolean isCourseTestPassed() { return courseTestPassed; }
        public void setCourseTestPassed(boolean courseTestPassed) { this.courseTestPassed = courseTestPassed; }

        public List<StudentProgress> getModuleProgressList() { return moduleProgressList; }
        public void setModuleProgressList(List<StudentProgress> moduleProgressList) { this.moduleProgressList = moduleProgressList; }

        public double getOverallProgressPercentage() {
            if (totalModules == 0) return 0.0;
            return (double) modulesCompleted / totalModules * 100.0;
        }
    }
}