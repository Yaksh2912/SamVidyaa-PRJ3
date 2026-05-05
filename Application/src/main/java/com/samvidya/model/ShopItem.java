package com.samvidya.model;

import java.time.LocalDateTime;

public class ShopItem {
    private Long id;
    private Long courseId;
    private String name;
    private String description;
    private int pointCost;
    private int maxQtyPerStudent;
    private boolean active;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public ShopItem() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getCourseId() { return courseId; }
    public void setCourseId(Long courseId) { this.courseId = courseId; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public int getPointCost() { return pointCost; }
    public void setPointCost(int pointCost) { this.pointCost = pointCost; }

    public int getMaxQtyPerStudent() { return maxQtyPerStudent; }
    public void setMaxQtyPerStudent(int maxQtyPerStudent) { this.maxQtyPerStudent = maxQtyPerStudent; }

    public boolean isActive() { return active; }
    public void setActive(boolean active) { this.active = active; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
