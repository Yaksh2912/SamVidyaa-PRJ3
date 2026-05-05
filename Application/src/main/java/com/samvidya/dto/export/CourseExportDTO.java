package com.samvidya.dto.export;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.databind.annotation.JsonDeserialize;
import java.time.LocalDateTime;

public class CourseExportDTO {
    private String exportType;
    private String exportVersion;
    
    @JsonDeserialize(using = com.samvidya.util.LenientLocalDateTimeDeserializer.class)
    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private LocalDateTime exportDate;
    
    private CourseDTO course;
    
    public CourseExportDTO() {
        this.exportType = "COURSE";
        this.exportVersion = "1.0";
        this.exportDate = LocalDateTime.now();
    }
    
    // Getters and Setters
    public String getExportType() { return exportType; }
    public void setExportType(String exportType) { this.exportType = exportType; }
    
    public String getExportVersion() { return exportVersion; }
    public void setExportVersion(String exportVersion) { this.exportVersion = exportVersion; }
    
    public LocalDateTime getExportDate() { return exportDate; }
    public void setExportDate(LocalDateTime exportDate) { this.exportDate = exportDate; }
    
    public CourseDTO getCourse() { return course; }
    public void setCourse(CourseDTO course) { this.course = course; }
}
