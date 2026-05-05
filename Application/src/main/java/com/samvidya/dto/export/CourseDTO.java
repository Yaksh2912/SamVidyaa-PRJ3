package com.samvidya.dto.export;

import java.util.ArrayList;
import java.util.List;
import com.fasterxml.jackson.annotation.JsonProperty;

public class CourseDTO {
    private String courseCode;
    private String courseName;
    private String description;
    private String subject;
    private String instructorName;
    private int courseTestQuestionsCount;
    @JsonProperty("isActive")
    private boolean isActive;
    private List<ModuleDTO> modules;
    private List<CodingQuestionDTO> courseTestQuestions;
    
    public CourseDTO() {
        this.modules = new ArrayList<>();
        this.courseTestQuestions = new ArrayList<>();
    }
    
    // Getters and Setters
    public String getCourseCode() { return courseCode; }
    public void setCourseCode(String courseCode) { this.courseCode = courseCode; }
    
    public String getCourseName() { return courseName; }
    public void setCourseName(String courseName) { this.courseName = courseName; }
    
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    
    public String getSubject() { return subject; }
    public void setSubject(String subject) { this.subject = subject; }
    
    public String getInstructorName() { return instructorName; }
    public void setInstructorName(String instructorName) { this.instructorName = instructorName; }
    
    public int getCourseTestQuestionsCount() { return courseTestQuestionsCount; }
    public void setCourseTestQuestionsCount(int courseTestQuestionsCount) { 
        this.courseTestQuestionsCount = courseTestQuestionsCount; 
    }
    
    public boolean isActive() { return isActive; }
    public void setActive(boolean active) { isActive = active; }
    
    public List<ModuleDTO> getModules() { return modules; }
    public void setModules(List<ModuleDTO> modules) { this.modules = modules; }
    
    public List<CodingQuestionDTO> getCourseTestQuestions() { return courseTestQuestions; }
    public void setCourseTestQuestions(List<CodingQuestionDTO> courseTestQuestions) { 
        this.courseTestQuestions = courseTestQuestions; 
    }
}
