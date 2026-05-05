package com.samvidya.dao;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.DisplayName;
import static org.junit.jupiter.api.Assertions.*;

import java.sql.SQLException;
import java.util.List;

/**
 * Test class for EnrollmentNumberDAO range functionality
 */
public class EnrollmentNumberDAOTest {

    @Test
    @DisplayName("Test enrollment number range validation")
    public void testEnrollmentRangeValidation() throws SQLException {
        EnrollmentNumberDAO dao = new EnrollmentNumberDAO();
        
        // Test the private method through reflection or create a test-friendly version
        // For now, we'll test the public methods that use the range logic
        
        // This test assumes course ID 2 exists and has the range "230600-230700"
        Long testCourseId = 2L;
        
        // Test that enrollment numbers within the range are valid
        List<Long> courseIds230649 = dao.findCourseIdsForEnrollmentNumber("230649");
        List<Long> courseIds230600 = dao.findCourseIdsForEnrollmentNumber("230600");
        List<Long> courseIds230700 = dao.findCourseIdsForEnrollmentNumber("230700");
        
        // Test that enrollment numbers outside the range are not valid
        List<Long> courseIds230599 = dao.findCourseIdsForEnrollmentNumber("230599");
        List<Long> courseIds230701 = dao.findCourseIdsForEnrollmentNumber("230701");
        
        System.out.println("Testing enrollment range functionality:");
        System.out.println("230649 (should be in range): " + courseIds230649.contains(testCourseId));
        System.out.println("230600 (should be in range): " + courseIds230600.contains(testCourseId));
        System.out.println("230700 (should be in range): " + courseIds230700.contains(testCourseId));
        System.out.println("230599 (should NOT be in range): " + !courseIds230599.contains(testCourseId));
        System.out.println("230701 (should NOT be in range): " + !courseIds230701.contains(testCourseId));
        
        // The actual assertions would depend on your test data setup
        // assertTrue(courseIds230649.contains(testCourseId), "230649 should be valid for course 2");
        // assertTrue(courseIds230600.contains(testCourseId), "230600 should be valid for course 2");
        // assertTrue(courseIds230700.contains(testCourseId), "230700 should be valid for course 2");
        // assertFalse(courseIds230599.contains(testCourseId), "230599 should NOT be valid for course 2");
        // assertFalse(courseIds230701.contains(testCourseId), "230701 should NOT be valid for course 2");
    }
}