package com.samvidya.service;

import com.samvidya.dao.CourseDAO;
import com.samvidya.dao.ModuleDAO;
import com.samvidya.dao.CodingQuestionDAO;
import com.samvidya.dao.TestCaseDAO;
import com.samvidya.dto.export.*;
import com.samvidya.model.Course;
import com.samvidya.model.Module;
import com.samvidya.model.CodingQuestion;
import com.samvidya.model.TestCase;
import com.samvidya.util.ExportUtil;

import java.sql.SQLException;
import java.util.ArrayList;
import java.util.List;

public class CourseExportService {
    private final CourseDAO courseDAO;
    private final ModuleDAO moduleDAO;
    private final CodingQuestionDAO codingQuestionDAO;
    private final TestCaseDAO testCaseDAO;
    private final ModuleExportService moduleExportService;
    
    public CourseExportService() {
        this.courseDAO = new CourseDAO();
        this.moduleDAO = new ModuleDAO();
        this.codingQuestionDAO = new CodingQuestionDAO();
        this.testCaseDAO = new TestCaseDAO();
        this.moduleExportService = new ModuleExportService();
    }
    
    /**
     * Export course to ZIP file
     * @param courseId Course ID to export
     * @param exportPath Directory path to save export
     * @return Path to created ZIP file
     */
    public String exportCourse(Long courseId, String exportPath) throws Exception {
        // 1. Fetch course data
        Course course = courseDAO.findById(courseId);
        if (course == null) {
            throw new IllegalArgumentException("Course not found with ID: " + courseId);
        }
        
        // 2. Build export DTO structure
        CourseExportDTO exportData = new CourseExportDTO();
        exportData.setCourse(convertCourseToDTO(course));
        
        // 3. Convert to JSON
        String json = ExportUtil.toJson(exportData);
        
        // 4. Create ZIP file
        String fileName = ExportUtil.generateExportFileName("course", course.getCourseCode());
        return ExportUtil.createZipFile(json, "course_data.json", exportPath, fileName);
    }
    
    /**
     * Convert Course entity to DTO with all related data
     */
    private CourseDTO convertCourseToDTO(Course course) throws SQLException {
        CourseDTO dto = new CourseDTO();
        
        // Set course fields
        dto.setCourseCode(course.getCourseCode());
        dto.setCourseName(course.getCourseName());
        dto.setDescription(course.getDescription());
        dto.setSubject(course.getSubject());
        dto.setInstructorName(course.getInstructorName());
        dto.setCourseTestQuestionsCount(course.getCourseTestQuestions());
        dto.setActive(course.isActive());
        
        // Fetch and convert modules (reuse module export logic)
        List<Module> modules = moduleDAO.findByCourseId(course.getId());
        List<ModuleDTO> moduleDTOs = new ArrayList<>();
        for (Module module : modules) {
            moduleDTOs.add(moduleExportService.convertModuleToDTO(module));
        }
        dto.setModules(moduleDTOs);
        
        // Fetch and convert course test questions
        List<CodingQuestion> courseTests = codingQuestionDAO.findCourseTests(course.getId());
        List<CodingQuestionDTO> courseTestDTOs = new ArrayList<>();
        for (CodingQuestion question : courseTests) {
            courseTestDTOs.add(convertQuestionToDTO(question));
        }
        dto.setCourseTestQuestions(courseTestDTOs);
        
        return dto;
    }
    
    /**
     * Convert CodingQuestion entity to DTO with test cases
     */
    private CodingQuestionDTO convertQuestionToDTO(CodingQuestion question) throws SQLException {
        CodingQuestionDTO dto = new CodingQuestionDTO();
        
        // Copy question fields
        dto.setQuestionText(question.getQuestionText());
        dto.setProblemStatement(question.getProblemStatement());
        dto.setDifficulty(question.getDifficulty());
        dto.setPoints(question.getPoints());
        dto.setTimeLimit(question.getTimeLimit());
        dto.setLanguage(question.getLanguage());
        
        // Fetch and convert test cases
        List<TestCase> testCases = testCaseDAO.findByQuestionId(question.getId());
        List<TestCaseDTO> testCaseDTOs = new ArrayList<>();
        for (TestCase testCase : testCases) {
            TestCaseDTO tcDTO = new TestCaseDTO();
            tcDTO.setInput(testCase.getInput());
            tcDTO.setExpectedOutput(testCase.getExpectedOutput());
            tcDTO.setSample(testCase.isSample());
            tcDTO.setOrderIndex(testCase.getOrderIndex());
            testCaseDTOs.add(tcDTO);
        }
        dto.setTestCases(testCaseDTOs);
        
        return dto;
    }
}
