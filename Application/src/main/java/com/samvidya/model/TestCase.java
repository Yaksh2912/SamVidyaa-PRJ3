package com.samvidya.model;

public class TestCase {
    private Long id;
    private Long taskId;
    private Long questionId; // For coding questions
    private String input;
    private String expectedOutput;
    private boolean isSample; // true for sample (shown to student), false for validation (hidden)
    private int orderIndex; // Order of test case
    
    public TestCase() {}
    
    public TestCase(String input, String expectedOutput, boolean isSample) {
        this.input = input;
        this.expectedOutput = expectedOutput;
        this.isSample = isSample;
    }
    
    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    
    public Long getTaskId() { return taskId; }
    public void setTaskId(Long taskId) { this.taskId = taskId; }
    
    public Long getQuestionId() { return questionId; }
    public void setQuestionId(Long questionId) { this.questionId = questionId; }
    
    public String getInput() { return input; }
    public void setInput(String input) { this.input = input; }
    
    public String getExpectedOutput() { return expectedOutput; }
    public void setExpectedOutput(String expectedOutput) { this.expectedOutput = expectedOutput; }
    
    public boolean isSample() { return isSample; }
    public void setSample(boolean sample) { isSample = sample; }
    
    public int getOrderIndex() { return orderIndex; }
    public void setOrderIndex(int orderIndex) { this.orderIndex = orderIndex; }
    
    // Helper method to calculate points for this test case
    public double calculatePoints(int totalPoints, int totalValidationCases) {
        if (isSample || totalValidationCases == 0) {
            return 0.0;
        }
        return (double) totalPoints / totalValidationCases;
    }
}