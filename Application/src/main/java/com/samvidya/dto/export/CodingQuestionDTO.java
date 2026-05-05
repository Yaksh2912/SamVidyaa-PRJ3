package com.samvidya.dto.export;

import java.util.ArrayList;
import java.util.List;

public class CodingQuestionDTO {
    private String questionText;
    private String problemStatement;
    private String expectedOutput;
    private String sampleInput;
    private String sampleOutput;
    private String difficulty;
    private int points;
    private int timeLimit;
    private String language;
    private List<TestCaseDTO> testCases;
    
    public CodingQuestionDTO() {
        this.testCases = new ArrayList<>();
    }
    
    // Getters and Setters
    public String getQuestionText() { return questionText; }
    public void setQuestionText(String questionText) { this.questionText = questionText; }
    
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
    
    public List<TestCaseDTO> getTestCases() { return testCases; }
    public void setTestCases(List<TestCaseDTO> testCases) { this.testCases = testCases; }
}
