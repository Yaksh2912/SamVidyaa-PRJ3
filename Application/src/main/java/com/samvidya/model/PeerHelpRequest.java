package com.samvidya.model;

import java.time.LocalDateTime;

public class PeerHelpRequest {
    private Long id;
    private Long requesterId;
    private Long helperId;
    private Long courseId;
    private Long moduleId;
    private Long taskId;
    private String status; // PENDING, ACCEPTED, REJECTED, EXPIRED, COMPLETED
    private LocalDateTime createdAt;
    private LocalDateTime respondedAt;
    private LocalDateTime completedAt;

    // Transient display fields (joined from other tables)
    private String requesterName;
    private String taskName;
    private String courseName;

    public PeerHelpRequest() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getRequesterId() { return requesterId; }
    public void setRequesterId(Long requesterId) { this.requesterId = requesterId; }

    public Long getHelperId() { return helperId; }
    public void setHelperId(Long helperId) { this.helperId = helperId; }

    public Long getCourseId() { return courseId; }
    public void setCourseId(Long courseId) { this.courseId = courseId; }

    public Long getModuleId() { return moduleId; }
    public void setModuleId(Long moduleId) { this.moduleId = moduleId; }

    public Long getTaskId() { return taskId; }
    public void setTaskId(Long taskId) { this.taskId = taskId; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getRespondedAt() { return respondedAt; }
    public void setRespondedAt(LocalDateTime respondedAt) { this.respondedAt = respondedAt; }

    public LocalDateTime getCompletedAt() { return completedAt; }
    public void setCompletedAt(LocalDateTime completedAt) { this.completedAt = completedAt; }

    public String getRequesterName() { return requesterName; }
    public void setRequesterName(String requesterName) { this.requesterName = requesterName; }

    public String getTaskName() { return taskName; }
    public void setTaskName(String taskName) { this.taskName = taskName; }

    public String getCourseName() { return courseName; }
    public void setCourseName(String courseName) { this.courseName = courseName; }

    /** True if the request is older than 60 seconds and still PENDING */
    public boolean isExpired() {
        return "PENDING".equals(status) && createdAt != null &&
               createdAt.isBefore(LocalDateTime.now().minusSeconds(60));
    }
}
