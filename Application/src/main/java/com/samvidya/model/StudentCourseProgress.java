package com.samvidya.model;

import java.time.LocalDateTime;

public class StudentCourseProgress {
    private Long id;
    private Long studentId;
    private Long courseId;
    private int currentModuleOrder;
    private int modulesCompleted;
    private int totalModules;
    private int totalCoursePoints;
    private boolean canAttemptCourseTest;
    private boolean courseTestCompleted;
    private int courseTestScore;
    private int courseTestMaxScore;
    private boolean courseTestPassed;
    private int peerHelpsGiven;
    private int peerHelpPointsEarned;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public StudentCourseProgress() {
        this.currentModuleOrder = 1;
        this.modulesCompleted = 0;
        this.totalModules = 0;
        this.totalCoursePoints = 0;
        this.canAttemptCourseTest = false;
        this.courseTestCompleted = false;
        this.courseTestScore = 0;
        this.courseTestMaxScore = 0;
        this.courseTestPassed = false;
    }

    public StudentCourseProgress(Long studentId, Long courseId) {
        this();
        this.studentId = studentId;
        this.courseId = courseId;
    }

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getStudentId() { return studentId; }
    public void setStudentId(Long studentId) { this.studentId = studentId; }

    public Long getCourseId() { return courseId; }
    public void setCourseId(Long courseId) { this.courseId = courseId; }

    public int getCurrentModuleOrder() { return currentModuleOrder; }
    public void setCurrentModuleOrder(int currentModuleOrder) { this.currentModuleOrder = currentModuleOrder; }

    public int getModulesCompleted() { return modulesCompleted; }
    public void setModulesCompleted(int modulesCompleted) { this.modulesCompleted = modulesCompleted; }

    public int getTotalModules() { return totalModules; }
    public void setTotalModules(int totalModules) { this.totalModules = totalModules; }

    public int getTotalCoursePoints() { return totalCoursePoints; }
    public void setTotalCoursePoints(int totalCoursePoints) { this.totalCoursePoints = totalCoursePoints; }

    public boolean isCanAttemptCourseTest() { return canAttemptCourseTest; }
    public void setCanAttemptCourseTest(boolean canAttemptCourseTest) { this.canAttemptCourseTest = canAttemptCourseTest; }

    public boolean isCourseTestCompleted() { return courseTestCompleted; }
    public void setCourseTestCompleted(boolean courseTestCompleted) { this.courseTestCompleted = courseTestCompleted; }

    public int getCourseTestScore() { return courseTestScore; }
    public void setCourseTestScore(int courseTestScore) { this.courseTestScore = courseTestScore; }

    public int getCourseTestMaxScore() { return courseTestMaxScore; }
    public void setCourseTestMaxScore(int courseTestMaxScore) { this.courseTestMaxScore = courseTestMaxScore; }

    public boolean isCourseTestPassed() { return courseTestPassed; }
    public void setCourseTestPassed(boolean courseTestPassed) { this.courseTestPassed = courseTestPassed; }

    public int getPeerHelpsGiven() { return peerHelpsGiven; }
    public void setPeerHelpsGiven(int peerHelpsGiven) { this.peerHelpsGiven = peerHelpsGiven; }

    public int getPeerHelpPointsEarned() { return peerHelpPointsEarned; }
    public void setPeerHelpPointsEarned(int peerHelpPointsEarned) { this.peerHelpPointsEarned = peerHelpPointsEarned; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }

    // Helper methods
    public double getProgressPercentage() {
        if (totalModules == 0) return 0.0;
        return (double) modulesCompleted / totalModules * 100.0;
    }

    public boolean canAccessModule(int moduleOrder) {
        return moduleOrder <= currentModuleOrder;
    }

    @Override
    public String toString() {
        return String.format("StudentCourseProgress{studentId=%d, courseId=%d, currentModule=%d, completed=%d/%d}", 
            studentId, courseId, currentModuleOrder, modulesCompleted, totalModules);
    }
}