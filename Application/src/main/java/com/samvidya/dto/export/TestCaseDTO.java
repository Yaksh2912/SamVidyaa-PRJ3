package com.samvidya.dto.export;

import com.fasterxml.jackson.annotation.JsonProperty;

public class TestCaseDTO {
    private String input;
    private String expectedOutput;
    @JsonProperty("isSample")
    private boolean isSample;
    private int orderIndex;
    
    public TestCaseDTO() {}
    
    public TestCaseDTO(String input, String expectedOutput, boolean isSample, int orderIndex) {
        this.input = input;
        this.expectedOutput = expectedOutput;
        this.isSample = isSample;
        this.orderIndex = orderIndex;
    }
    
    // Getters and Setters
    public String getInput() { return input; }
    public void setInput(String input) { this.input = input; }
    
    public String getExpectedOutput() { return expectedOutput; }
    public void setExpectedOutput(String expectedOutput) { this.expectedOutput = expectedOutput; }
    
    public boolean isSample() { return isSample; }
    public void setSample(boolean sample) { isSample = sample; }
    
    public int getOrderIndex() { return orderIndex; }
    public void setOrderIndex(int orderIndex) { this.orderIndex = orderIndex; }
}
