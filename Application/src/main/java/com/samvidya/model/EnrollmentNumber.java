package com.samvidya.model;

import java.time.LocalDateTime;

public class EnrollmentNumber {
    private Long id;
    private Long courseId;
    private String enrollmentPattern; // Either single number "230409" or range "210000-210100"
    private String patternType; // "SINGLE" or "RANGE"
    private String startNumber; // For ranges, the start number
    private String endNumber; // For ranges, the end number
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public EnrollmentNumber() {}

    public EnrollmentNumber(Long courseId, String enrollmentPattern) {
        this.courseId = courseId;
        this.enrollmentPattern = enrollmentPattern;
        parsePattern();
    }

    // Parse the pattern to determine type and extract range if applicable
    private void parsePattern() {
        if (enrollmentPattern.contains("-")) {
            this.patternType = "RANGE";
            String[] parts = enrollmentPattern.split("-");
            this.startNumber = parts[0].trim();
            this.endNumber = parts[1].trim();
        } else {
            this.patternType = "SINGLE";
            this.startNumber = enrollmentPattern.trim();
            this.endNumber = null;
        }
    }

    // Check if a given enrollment number matches this pattern
    public boolean matches(String enrollmentNumber) {
        if (patternType.equals("SINGLE")) {
            return startNumber.equals(enrollmentNumber);
        } else if (patternType.equals("RANGE")) {
            try {
                long number = Long.parseLong(enrollmentNumber);
                long start = Long.parseLong(startNumber);
                long end = Long.parseLong(endNumber);
                return number >= start && number <= end;
            } catch (NumberFormatException e) {
                return false;
            }
        }
        return false;
    }

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getCourseId() { return courseId; }
    public void setCourseId(Long courseId) { this.courseId = courseId; }

    public String getEnrollmentPattern() { return enrollmentPattern; }
    public void setEnrollmentPattern(String enrollmentPattern) { 
        this.enrollmentPattern = enrollmentPattern;
        parsePattern();
    }

    public String getPatternType() { return patternType; }
    public void setPatternType(String patternType) { this.patternType = patternType; }

    public String getStartNumber() { return startNumber; }
    public void setStartNumber(String startNumber) { this.startNumber = startNumber; }

    public String getEndNumber() { return endNumber; }
    public void setEndNumber(String endNumber) { this.endNumber = endNumber; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}