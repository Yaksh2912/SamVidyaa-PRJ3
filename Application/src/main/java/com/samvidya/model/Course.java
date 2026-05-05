package com.samvidya.model;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

public class Course {
    private Long id;
    private String courseCode;
    private String courseName;
    private String description;
    private String subject; // Python, C++, Java, DSA, etc.
    private Long instructorId;
    private String instructorName;
    private int courseTestQuestions = 5; // Configurable number of questions in final course test
    private int courseTestTimeLimit = 120; // Time limit in minutes for course test
    private boolean isActive;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private List<Module> modules;

    public Course() {
        this.modules = new ArrayList<>();
    }

    public Course(String courseCode, String courseName, String description, String subject) {
        this();
        this.courseCode = courseCode;
        this.courseName = courseName;
        this.description = description;
        this.subject = subject;
    }

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getCourseCode() { return courseCode; }
    public void setCourseCode(String courseCode) { this.courseCode = courseCode; }

    public String getCourseName() { return courseName; }
    public void setCourseName(String courseName) { this.courseName = courseName; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public String getSubject() { return subject; }
    public void setSubject(String subject) { this.subject = subject; }

    public Long getInstructorId() { return instructorId; }
    public void setInstructorId(Long instructorId) { this.instructorId = instructorId; }

    public String getInstructorName() { return instructorName; }
    public void setInstructorName(String instructorName) { this.instructorName = instructorName; }

    public int getCourseTestQuestions() { return courseTestQuestions; }
    public void setCourseTestQuestions(int courseTestQuestions) { this.courseTestQuestions = courseTestQuestions; }

    public int getCourseTestTimeLimit() { return courseTestTimeLimit; }
    public void setCourseTestTimeLimit(int courseTestTimeLimit) { this.courseTestTimeLimit = courseTestTimeLimit; }

    public boolean isActive() { return isActive; }
    public void setActive(boolean active) { isActive = active; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }

    public List<Module> getModules() { return modules; }
    public void setModules(List<Module> modules) { this.modules = modules; }

    public void addModule(Module module) {
        if (this.modules == null) {
            this.modules = new ArrayList<>();
        }
        this.modules.add(module);
    }
}