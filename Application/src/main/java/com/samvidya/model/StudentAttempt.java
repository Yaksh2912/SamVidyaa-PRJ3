package com.samvidya.model;

import java.time.LocalDateTime;

public class StudentAttempt {
    private Long id;
    private Long studentId;
    private Long taskId;
    private Long questionId; // For coding question attempts
    private Long moduleId;
    private Long courseId;
    private String attemptType; // TASK, MODULE_TEST, COURSE_TEST
    private String submittedCode;
    private String executionResult;
    private boolean isCorrect;
    private int score;
    private int maxScore;
    private int attemptNumber;
    private long executionTime; // in milliseconds
    private String status; // SUBMITTED, RUNNING, COMPLETED, ERROR
    private boolean isLatest; // Whether this is the latest attempt
    private boolean isPeerHelped; // Whether this attempt was submitted by a peer helper
    private Long peerHelpRequestId; // FK to peer_help_requests if isPeerHelped
    private LocalDateTime submittedAt;
    private LocalDateTime completedAt;

    public StudentAttempt() {}

    public StudentAttempt(Long studentId, Long taskId, String attemptType) {
        this.studentId = studentId;
        this.taskId = taskId;
        this.attemptType = attemptType;
    }

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getStudentId() { return studentId; }
    public void setStudentId(Long studentId) { this.studentId = studentId; }

    public Long getTaskId() { return taskId; }
    public void setTaskId(Long taskId) { this.taskId = taskId; }

    public Long getQuestionId() { return questionId; }
    public void setQuestionId(Long questionId) { this.questionId = questionId; }

    public Long getModuleId() { return moduleId; }
    public void setModuleId(Long moduleId) { this.moduleId = moduleId; }

    public Long getCourseId() { return courseId; }
    public void setCourseId(Long courseId) { this.courseId = courseId; }

    public String getAttemptType() { return attemptType; }
    public void setAttemptType(String attemptType) { this.attemptType = attemptType; }

    public String getSubmittedCode() { return submittedCode; }
    public void setSubmittedCode(String submittedCode) { this.submittedCode = submittedCode; }

    public String getExecutionResult() { return executionResult; }
    public void setExecutionResult(String executionResult) { this.executionResult = executionResult; }

    public boolean isCorrect() { return isCorrect; }
    public void setCorrect(boolean correct) { isCorrect = correct; }

    public int getScore() { return score; }
    public void setScore(int score) { this.score = score; }

    public int getMaxScore() { return maxScore; }
    public void setMaxScore(int maxScore) { this.maxScore = maxScore; }

    public int getAttemptNumber() { return attemptNumber; }
    public void setAttemptNumber(int attemptNumber) { this.attemptNumber = attemptNumber; }

    public long getExecutionTime() { return executionTime; }
    public void setExecutionTime(long executionTime) { this.executionTime = executionTime; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public boolean isLatest() { return isLatest; }
    public void setLatest(boolean latest) { isLatest = latest; }

    public boolean isPeerHelped() { return isPeerHelped; }
    public void setPeerHelped(boolean peerHelped) { isPeerHelped = peerHelped; }

    public Long getPeerHelpRequestId() { return peerHelpRequestId; }
    public void setPeerHelpRequestId(Long peerHelpRequestId) { this.peerHelpRequestId = peerHelpRequestId; }

    public LocalDateTime getSubmittedAt() { return submittedAt; }
    public void setSubmittedAt(LocalDateTime submittedAt) { this.submittedAt = submittedAt; }

    public LocalDateTime getCompletedAt() { return completedAt; }
    public void setCompletedAt(LocalDateTime completedAt) { this.completedAt = completedAt; }
}