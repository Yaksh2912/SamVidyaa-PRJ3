package com.samvidya.model;

import java.time.LocalDateTime;
import java.util.List;

public class Task {
    private Long id;
    private Long moduleId;
    private String taskName;
    private String description;
    private String problemStatement;
    private String expectedOutput;
    private String sampleInput;
    private String sampleOutput;
    private String difficulty; // EASY, MEDIUM, HARD
    private int points;
    private int timeLimit; // in minutes
    private String language; // Python, Java, C++
    private int testCasesCount; // Total number of validation test cases
    private List<String> attachmentPaths;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public Task() {}

    public Task(String taskName, String description, String problemStatement) {
        this.taskName = taskName;
        this.description = description;
        this.problemStatement = problemStatement;
    }

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getModuleId() { return moduleId; }
    public void setModuleId(Long moduleId) { this.moduleId = moduleId; }

    public String getTaskName() { return taskName; }
    public void setTaskName(String taskName) { this.taskName = taskName; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public String getProblemStatement() { return problemStatement; }
    public void setProblemStatement(String problemStatement) { this.problemStatement = problemStatement; }

    public String getExpectedOutput() { return expectedOutput; }
    public void setExpectedOutput(String expectedOutput) { this.expectedOutput = expectedOutput; }

    public String getSampleInput() { return sampleInput; }
    public void setSampleInput(String sampleInput) { this.sampleInput = sampleInput; }

    public String getSampleOutput() { return sampleOutput; }
    public void setSampleOutput(String sampleOutput) { this.sampleOutput = sampleOutput; }

    public String getDifficulty() { return difficulty; }
    public void setDifficulty(String difficulty) { this.difficulty = difficulty; }

    public int getPoints() { return points; }
    public void setPoints(int points) { this.points = points; }

    public int getTimeLimit() { return timeLimit; }
    public void setTimeLimit(int timeLimit) { this.timeLimit = timeLimit; }

    public String getLanguage() { return language; }
    public void setLanguage(String language) { this.language = language; }

    public int getTestCasesCount() { return testCasesCount; }
    public void setTestCasesCount(int testCasesCount) { this.testCasesCount = testCasesCount; }

    public List<String> getAttachmentPaths() { return attachmentPaths; }
    public void setAttachmentPaths(List<String> attachmentPaths) { this.attachmentPaths = attachmentPaths; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}