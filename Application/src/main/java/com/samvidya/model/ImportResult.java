package com.samvidya.model;

import java.util.ArrayList;
import java.util.List;

public class ImportResult {
    private boolean success;
    private Long courseId;
    private String courseCode;
    private String courseName;
    private Long moduleId;
    private String moduleName;
    private int modulesImported;
    private int tasksImported;
    private int questionsImported;
    private int courseQuestionsImported;
    private List<String> warnings;
    private String errorMessage;
    
    public ImportResult() {
        this.warnings = new ArrayList<>();
        this.success = false;
    }
    
    public void addWarning(String warning) {
        this.warnings.add(warning);
    }
    
    public String getSummary() {
        StringBuilder sb = new StringBuilder();
        sb.append("Import completed successfully!\n\n");
        
        if (courseId != null) {
            sb.append("Course: ").append(courseName).append(" (").append(courseCode).append(")\n");
            sb.append("Modules imported: ").append(modulesImported).append("\n");
            sb.append("Tasks imported: ").append(tasksImported).append("\n");
            sb.append("Module test questions imported: ").append(questionsImported).append("\n");
            sb.append("Course test questions imported: ").append(courseQuestionsImported).append("\n");
        } else if (moduleId != null) {
            sb.append("Module: ").append(moduleName).append("\n");
            sb.append("Tasks imported: ").append(tasksImported).append("\n");
            sb.append("Test questions imported: ").append(questionsImported).append("\n");
        }
        
        if (!warnings.isEmpty()) {
            sb.append("\nWarnings:\n");
            for (String warning : warnings) {
                sb.append("- ").append(warning).append("\n");
            }
        }
        
        return sb.toString();
    }
    
    // Getters and Setters
    public boolean isSuccess() { return success; }
    public void setSuccess(boolean success) { this.success = success; }
    
    public Long getCourseId() { return courseId; }
    public void setCourseId(Long courseId) { this.courseId = courseId; }
    
    public String getCourseCode() { return courseCode; }
    public void setCourseCode(String courseCode) { this.courseCode = courseCode; }
    
    public String getCourseName() { return courseName; }
    public void setCourseName(String courseName) { this.courseName = courseName; }
    
    public Long getModuleId() { return moduleId; }
    public void setModuleId(Long moduleId) { this.moduleId = moduleId; }
    
    public String getModuleName() { return moduleName; }
    public void setModuleName(String moduleName) { this.moduleName = moduleName; }
    
    public int getModulesImported() { return modulesImported; }
    public void setModulesImported(int modulesImported) { this.modulesImported = modulesImported; }
    
    public int getTasksImported() { return tasksImported; }
    public void setTasksImported(int tasksImported) { this.tasksImported = tasksImported; }
    
    public int getQuestionsImported() { return questionsImported; }
    public void setQuestionsImported(int questionsImported) { this.questionsImported = questionsImported; }
    
    public int getCourseQuestionsImported() { return courseQuestionsImported; }
    public void setCourseQuestionsImported(int courseQuestionsImported) { 
        this.courseQuestionsImported = courseQuestionsImported; 
    }
    
    public List<String> getWarnings() { return warnings; }
    public void setWarnings(List<String> warnings) { this.warnings = warnings; }
    
    public String getErrorMessage() { return errorMessage; }
    public void setErrorMessage(String errorMessage) { this.errorMessage = errorMessage; }
}
