package com.samvidya.model;

import java.time.LocalDateTime;
import java.util.List;

public class StudentProgress {
    private Long id;
    private Long studentId;
    private Long courseId;
    private Long moduleId;
    private List<Long> assignedQuestionIds; // Random test questions for module tests
    private int completedTasks;
    private int totalTasks;
    private boolean moduleTestCompleted;
    private boolean courseTestCompleted;
    private int totalScore;
    private int maxPossibleScore;
    private double progressPercentage;
    private String moduleStatus; // NOT_STARTED, IN_PROGRESS, TASKS_COMPLETED, MODULE_COMPLETED
    private int tasksPassedCount;
    private int minTasksRequired;
    private boolean canAttemptModuleTest;
    private int moduleTestScore;
    private int moduleTestMaxScore;
    private boolean moduleTestPassed;
    private LocalDateTime lastActivity;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public StudentProgress() {}

    public StudentProgress(Long studentId, Long courseId, Long moduleId) {
        this.studentId = studentId;
        this.courseId = courseId;
        this.moduleId = moduleId;
        this.completedTasks = 0;
        this.totalTasks = 0; // Will be set based on module configuration
        this.progressPercentage = 0.0;
        this.moduleStatus = "NOT_STARTED";
        this.tasksPassedCount = 0;
        this.minTasksRequired = 0;
        this.canAttemptModuleTest = false;
        this.moduleTestScore = 0;
        this.moduleTestMaxScore = 0;
        this.moduleTestPassed = false;
    }

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getStudentId() { return studentId; }
    public void setStudentId(Long studentId) { this.studentId = studentId; }

    public Long getCourseId() { return courseId; }
    public void setCourseId(Long courseId) { this.courseId = courseId; }

    public Long getModuleId() { return moduleId; }
    public void setModuleId(Long moduleId) { this.moduleId = moduleId; }

    public List<Long> getAssignedQuestionIds() { return assignedQuestionIds; }
    public void setAssignedQuestionIds(List<Long> assignedQuestionIds) { this.assignedQuestionIds = assignedQuestionIds; }

    public int getCompletedTasks() { return completedTasks; }
    public void setCompletedTasks(int completedTasks) { this.completedTasks = completedTasks; }

    public int getTotalTasks() { return totalTasks; }
    public void setTotalTasks(int totalTasks) { this.totalTasks = totalTasks; }

    public boolean isModuleTestCompleted() { return moduleTestCompleted; }
    public void setModuleTestCompleted(boolean moduleTestCompleted) { this.moduleTestCompleted = moduleTestCompleted; }

    public boolean isCourseTestCompleted() { return courseTestCompleted; }
    public void setCourseTestCompleted(boolean courseTestCompleted) { this.courseTestCompleted = courseTestCompleted; }

    public int getTotalScore() { return totalScore; }
    public void setTotalScore(int totalScore) { this.totalScore = totalScore; }

    public int getMaxPossibleScore() { return maxPossibleScore; }
    public void setMaxPossibleScore(int maxPossibleScore) { this.maxPossibleScore = maxPossibleScore; }

    public double getProgressPercentage() { return progressPercentage; }
    public void setProgressPercentage(double progressPercentage) { this.progressPercentage = progressPercentage; }

    public String getModuleStatus() { return moduleStatus; }
    public void setModuleStatus(String moduleStatus) { this.moduleStatus = moduleStatus; }

    public int getTasksPassedCount() { return tasksPassedCount; }
    public void setTasksPassedCount(int tasksPassedCount) { this.tasksPassedCount = tasksPassedCount; }

    public int getMinTasksRequired() { return minTasksRequired; }
    public void setMinTasksRequired(int minTasksRequired) { this.minTasksRequired = minTasksRequired; }

    public boolean isCanAttemptModuleTest() { return canAttemptModuleTest; }
    public void setCanAttemptModuleTest(boolean canAttemptModuleTest) { this.canAttemptModuleTest = canAttemptModuleTest; }

    public int getModuleTestScore() { return moduleTestScore; }
    public void setModuleTestScore(int moduleTestScore) { this.moduleTestScore = moduleTestScore; }

    public int getModuleTestMaxScore() { return moduleTestMaxScore; }
    public void setModuleTestMaxScore(int moduleTestMaxScore) { this.moduleTestMaxScore = moduleTestMaxScore; }

    public boolean isModuleTestPassed() { return moduleTestPassed; }
    public void setModuleTestPassed(boolean moduleTestPassed) { this.moduleTestPassed = moduleTestPassed; }

    public LocalDateTime getLastActivity() { return lastActivity; }
    public void setLastActivity(LocalDateTime lastActivity) { this.lastActivity = lastActivity; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }

    public void updateProgress() {
        if (minTasksRequired > 0) {
            this.progressPercentage = (double) tasksPassedCount / minTasksRequired * 100.0;
        }
    }

    // Helper methods
    public boolean isCompleted() {
        return "MODULE_COMPLETED".equals(moduleStatus);
    }

    public boolean canAccessModuleTest() {
        return canAttemptModuleTest && !moduleTestPassed;
    }

    public String getProgressSummary() {
        return String.format("%d/%d tasks passed, Module: %s", 
            tasksPassedCount, minTasksRequired, getStatusDisplayText());
    }

    public String getStatusDisplayText() {
        switch (moduleStatus) {
            case "NOT_STARTED": return "Not Started";
            case "IN_PROGRESS": return String.format("In Progress (%d/%d tasks)", tasksPassedCount, minTasksRequired);
            case "TASKS_COMPLETED": return "Ready for Module Test";
            case "MODULE_COMPLETED": return "Completed";
            default: return moduleStatus;
        }
    }

    public String getStatusColor() {
        switch (moduleStatus) {
            case "NOT_STARTED": return "#6c757d"; // Gray
            case "IN_PROGRESS": return "#ffc107"; // Yellow
            case "TASKS_COMPLETED": return "#17a2b8"; // Blue
            case "MODULE_COMPLETED": return "#28a745"; // Green
            default: return "#6c757d";
        }
    }
}