package com.samvidya.model;

import java.time.LocalDateTime;

public class CourseEmailAccess {
    private Long id;
    private String email;
    private Long courseId;
    private boolean isActive;
    private LocalDateTime createdAt;

    public CourseEmailAccess() {}

    public CourseEmailAccess(String email, Long courseId) {
        this.email = email;
        this.courseId = courseId;
        this.isActive = true;
    }

    // Getters and Setters
    public Long getId() { 
        return id; 
    }
    
    public void setId(Long id) { 
        this.id = id; 
    }

    public String getEmail() { 
        return email; 
    }
    
    public void setEmail(String email) { 
        this.email = email; 
    }

    public Long getCourseId() { 
        return courseId; 
    }
    
    public void setCourseId(Long courseId) { 
        this.courseId = courseId; 
    }

    public boolean isActive() { 
        return isActive; 
    }
    
    public void setActive(boolean active) { 
        isActive = active; 
    }

    public LocalDateTime getCreatedAt() { 
        return createdAt; 
    }
    
    public void setCreatedAt(LocalDateTime createdAt) { 
        this.createdAt = createdAt; 
    }
}
