package com.samvidya.model;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

public class Module {
    private Long id;
    private Long courseId;
    private String moduleName;
    private String description;
    private int moduleOrder;
    private int tasksPerModule = 10; // Configurable number of tasks per module
    private int moduleTestQuestions = 3; // Configurable number of questions in module test
    private int testQuestionsPerModule = 2; // Number of questions assigned to each student
    private int testTimeLimit = 60; // Time limit in minutes for module test
    private int totalTasks = 0; // Total number of tasks in this module
    private int totalTestQuestions = 0; // Total number of test questions in this module
    private boolean isActive;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private List<Task> tasks;
    private List<CodingQuestion> moduleTestQuestions_list; // Renamed to avoid conflict

    public Module() {
        this.tasks = new ArrayList<>();
        this.moduleTestQuestions_list = new ArrayList<>();
    }

    public Module(String moduleName, String description, int moduleOrder) {
        this();
        this.moduleName = moduleName;
        this.description = description;
        this.moduleOrder = moduleOrder;
    }

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getCourseId() { return courseId; }
    public void setCourseId(Long courseId) { this.courseId = courseId; }

    public String getModuleName() { return moduleName; }
    public void setModuleName(String moduleName) { this.moduleName = moduleName; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public int getModuleOrder() { return moduleOrder; }
    public void setModuleOrder(int moduleOrder) { this.moduleOrder = moduleOrder; }

    public int getTasksPerModule() { return tasksPerModule; }
    public void setTasksPerModule(int tasksPerModule) { this.tasksPerModule = tasksPerModule; }

    public int getModuleTestQuestions() { return moduleTestQuestions; }
    public void setModuleTestQuestions(int moduleTestQuestions) { this.moduleTestQuestions = moduleTestQuestions; }

    public int getTestQuestionsPerModule() { return testQuestionsPerModule; }
    public void setTestQuestionsPerModule(int testQuestionsPerModule) { this.testQuestionsPerModule = testQuestionsPerModule; }

    public int getTestTimeLimit() { return testTimeLimit; }
    public void setTestTimeLimit(int testTimeLimit) { this.testTimeLimit = testTimeLimit; }

    public int getTotalTasks() { return totalTasks; }
    public void setTotalTasks(int totalTasks) { this.totalTasks = totalTasks; }

    public int getTotalTestQuestions() { return totalTestQuestions; }
    public void setTotalTestQuestions(int totalTestQuestions) { this.totalTestQuestions = totalTestQuestions; }

    public boolean isActive() { return isActive; }
    public void setActive(boolean active) { isActive = active; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }

    public List<Task> getTasks() { return tasks; }
    public void setTasks(List<Task> tasks) { this.tasks = tasks; }

    public List<CodingQuestion> getModuleTestQuestionsList() { return moduleTestQuestions_list; }
    public void setModuleTestQuestionsList(List<CodingQuestion> moduleTestQuestions_list) { 
        this.moduleTestQuestions_list = moduleTestQuestions_list; 
    }

    public void addTask(Task task) {
        if (this.tasks == null) {
            this.tasks = new ArrayList<>();
        }
        this.tasks.add(task);
    }

    public void addModuleTestQuestion(CodingQuestion question) {
        if (this.moduleTestQuestions_list == null) {
            this.moduleTestQuestions_list = new ArrayList<>();
        }
        this.moduleTestQuestions_list.add(question);
    }
}