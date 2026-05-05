package com.samvidya.dto.export;

import java.util.ArrayList;
import java.util.List;
import com.fasterxml.jackson.annotation.JsonProperty;

public class ModuleDTO {
    private String moduleName;
    private String description;
    private int moduleOrder;
    private int tasksPerModule;
    private int moduleTestQuestionsCount;
    private int testQuestionsPerModule;
    private int testTimeLimit;
    @JsonProperty("isActive")
    private boolean isActive;
    private List<TaskDTO> tasks;
    private List<CodingQuestionDTO> moduleTestQuestions;
    
    public ModuleDTO() {
        this.tasks = new ArrayList<>();
        this.moduleTestQuestions = new ArrayList<>();
    }
    
    // Getters and Setters
    public String getModuleName() { return moduleName; }
    public void setModuleName(String moduleName) { this.moduleName = moduleName; }
    
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    
    public int getModuleOrder() { return moduleOrder; }
    public void setModuleOrder(int moduleOrder) { this.moduleOrder = moduleOrder; }
    
    public int getTasksPerModule() { return tasksPerModule; }
    public void setTasksPerModule(int tasksPerModule) { this.tasksPerModule = tasksPerModule; }
    
    public int getModuleTestQuestionsCount() { return moduleTestQuestionsCount; }
    public void setModuleTestQuestionsCount(int moduleTestQuestionsCount) { 
        this.moduleTestQuestionsCount = moduleTestQuestionsCount; 
    }
    
    public int getTestQuestionsPerModule() { return testQuestionsPerModule; }
    public void setTestQuestionsPerModule(int testQuestionsPerModule) { this.testQuestionsPerModule = testQuestionsPerModule; }
    
    public int getTestTimeLimit() { return testTimeLimit; }
    public void setTestTimeLimit(int testTimeLimit) { this.testTimeLimit = testTimeLimit; }
    
    public boolean isActive() { return isActive; }
    public void setActive(boolean active) { isActive = active; }
    
    public List<TaskDTO> getTasks() { return tasks; }
    public void setTasks(List<TaskDTO> tasks) { this.tasks = tasks; }
    
    public List<CodingQuestionDTO> getModuleTestQuestions() { return moduleTestQuestions; }
    public void setModuleTestQuestions(List<CodingQuestionDTO> moduleTestQuestions) { 
        this.moduleTestQuestions = moduleTestQuestions; 
    }
}
