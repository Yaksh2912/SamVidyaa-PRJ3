package com.samvidya.model;

import java.time.LocalDateTime;

public class PeerHelpRecord {
    private Long id;
    private Long requestId;
    private Long helperId;
    private Long helpedStudentId;
    private Long courseId;
    private Long taskId;
    private int pointsEarned;
    private int helperPoints;
    private int helpedPoints;
    private LocalDateTime completedAt;

    public PeerHelpRecord() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getRequestId() { return requestId; }
    public void setRequestId(Long requestId) { this.requestId = requestId; }

    public Long getHelperId() { return helperId; }
    public void setHelperId(Long helperId) { this.helperId = helperId; }

    public Long getHelpedStudentId() { return helpedStudentId; }
    public void setHelpedStudentId(Long helpedStudentId) { this.helpedStudentId = helpedStudentId; }

    public Long getCourseId() { return courseId; }
    public void setCourseId(Long courseId) { this.courseId = courseId; }

    public Long getTaskId() { return taskId; }
    public void setTaskId(Long taskId) { this.taskId = taskId; }

    public int getPointsEarned() { return pointsEarned; }
    public void setPointsEarned(int pointsEarned) { this.pointsEarned = pointsEarned; }

    public int getHelperPoints() { return helperPoints; }
    public void setHelperPoints(int helperPoints) { this.helperPoints = helperPoints; }

    public int getHelpedPoints() { return helpedPoints; }
    public void setHelpedPoints(int helpedPoints) { this.helpedPoints = helpedPoints; }

    public LocalDateTime getCompletedAt() { return completedAt; }
    public void setCompletedAt(LocalDateTime completedAt) { this.completedAt = completedAt; }
}
