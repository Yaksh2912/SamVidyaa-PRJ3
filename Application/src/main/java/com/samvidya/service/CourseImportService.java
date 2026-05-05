package com.samvidya.service;

import com.samvidya.dao.CourseDAO;
import com.samvidya.dao.ModuleDAO;
import com.samvidya.dao.CodingQuestionDAO;
import com.samvidya.dao.TestCaseDAO;
import com.samvidya.dto.export.*;
import com.samvidya.model.*;
import com.samvidya.util.ExportUtil;

import java.sql.SQLException;
import java.util.Random;
import java.util.logging.Logger;
import java.util.logging.Level;

public class CourseImportService {
    private static final Logger LOGGER = Logger.getLogger(CourseImportService.class.getName());
    private final CourseDAO courseDAO;
    private final ModuleDAO moduleDAO;
    private final ModuleImportService moduleImportService;
    private final CodingQuestionDAO codingQuestionDAO;
    private final TestCaseDAO testCaseDAO;
    
    public CourseImportService() {
        this.courseDAO = new CourseDAO();
        this.moduleDAO = new ModuleDAO();
        this.moduleImportService = new ModuleImportService();
        this.codingQuestionDAO = new CodingQuestionDAO();
        this.testCaseDAO = new TestCaseDAO();
    }
    
    /**
     * Import course from ZIP file
     * @param zipFilePath Path to ZIP file
     * @param currentInstructor Current logged-in instructor
     * @return ImportResult with summary
     */
    public ImportResult importCourse(String zipFilePath, User currentInstructor) throws Exception {
        ImportResult result = new ImportResult();
        
        try {
            // 1. Read and parse ZIP file
            String json = ExportUtil.readZipFile(zipFilePath, "course_data.json");
            CourseExportDTO exportData = ExportUtil.fromJson(json, CourseExportDTO.class);
            
            // 2. Validate export version
            if (!"1.0".equals(exportData.getExportVersion())) {
                throw new IllegalArgumentException("Unsupported export version: " + exportData.getExportVersion());
            }
            
            LOGGER.info("Starting import for course: " + exportData.getCourse().getCourseName());
            
            // 3. Resolve course code conflict
            CourseDTO courseDTO = exportData.getCourse();
            String originalCode = courseDTO.getCourseCode();
            String finalCode = resolveCourseCodeConflict(originalCode);
            
            if (!originalCode.equals(finalCode)) {
                result.addWarning("Course code changed from '" + originalCode + "' to '" + finalCode + "' due to conflict");
                courseDTO.setCourseCode(finalCode);
            }
            
            // 4. Import course
            Course course = new Course();
            course.setCourseCode(finalCode);
            course.setCourseName(courseDTO.getCourseName());
            course.setDescription(courseDTO.getDescription());
            course.setSubject(courseDTO.getSubject());
            course.setInstructorId(currentInstructor.getId());
            course.setInstructorName(currentInstructor.getFullName());
            course.setCourseTestQuestions(courseDTO.getCourseTestQuestionsCount());
            course.setActive(courseDTO.isActive());
            
            Long courseId = courseDAO.save(course);
            LOGGER.info(String.format("Imported course '%s' with ID %d (Active: %b)", finalCode, courseId, course.isActive()));
            
            result.setCourseId(courseId);
            result.setCourseCode(finalCode);
            result.setCourseName(courseDTO.getCourseName());
            
            // 5. Import modules
            LOGGER.info("Starting import of " + courseDTO.getModules().size() + " modules");
            int modulesImported = 0;
            int totalTasks = 0;
            int totalModuleQuestions = 0;
            
            for (ModuleDTO moduleDTO : courseDTO.getModules()) {
                LOGGER.info("Importing module: " + moduleDTO.getModuleName());
                ImportResult moduleResult = importModuleFromDTO(moduleDTO, courseId);
                modulesImported++;
                totalTasks += moduleResult.getTasksImported();
                totalModuleQuestions += moduleResult.getQuestionsImported();
            }
            
            result.setModulesImported(modulesImported);
            result.setTasksImported(totalTasks);
            result.setQuestionsImported(totalModuleQuestions);
            
            // 6. Import course test questions
            int courseQuestionsImported = 0;
            for (CodingQuestionDTO questionDTO : courseDTO.getCourseTestQuestions()) {
                importCourseTestQuestion(questionDTO, courseId);
                courseQuestionsImported++;
            }
            result.setCourseQuestionsImported(courseQuestionsImported);
            
            result.setSuccess(true);
            
        } catch (Exception e) {
            result.setSuccess(false);
            result.setErrorMessage(e.getMessage());
            throw e;
        }
        
        return result;
    }
    
    /**
     * Resolve course code conflict
     * Strategy: Try appending A-Z for short codes, otherwise generate random 6-char code
     */
    private String resolveCourseCodeConflict(String courseCode) throws SQLException {
        Course existing = courseDAO.findByCourseCode(courseCode);
        if (existing == null) {
            return courseCode; // No conflict
        }
        
        // Try appending suffix to original code (for short codes)
        if (courseCode.length() <= 4) {
            for (char suffix = 'A'; suffix <= 'Z'; suffix++) {
                String newCode = courseCode + suffix;
                if (courseDAO.findByCourseCode(newCode) == null) {
                    return newCode;
                }
            }
        }
        
        // Generate random 6-character alphanumeric code
        String chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
        Random random = new Random();
        String newCode;
        int attempts = 0;
        do {
            StringBuilder sb = new StringBuilder(6);
            for (int i = 0; i < 6; i++) {
                sb.append(chars.charAt(random.nextInt(chars.length())));
            }
            newCode = sb.toString();
            attempts++;
        } while (courseDAO.findByCourseCode(newCode) != null && attempts < 100);
        
        if (attempts >= 100) {
            throw new RuntimeException("Failed to generate unique course code after 100 attempts");
        }
        
        return newCode;
    }
    
    /**
     * Import module from DTO
     */
    private ImportResult importModuleFromDTO(ModuleDTO moduleDTO, Long courseId) throws SQLException {
        ImportResult result = new ImportResult();
        
        // Import module
        com.samvidya.model.Module module = new com.samvidya.model.Module();
        module.setCourseId(courseId);
        module.setModuleName(moduleDTO.getModuleName());
        module.setDescription(moduleDTO.getDescription());
        module.setModuleOrder(moduleDTO.getModuleOrder());
        module.setTasksPerModule(moduleDTO.getTasksPerModule());
        module.setModuleTestQuestions(moduleDTO.getModuleTestQuestionsCount());
        module.setTestQuestionsPerModule(moduleDTO.getTestQuestionsPerModule());
        module.setTestTimeLimit(moduleDTO.getTestTimeLimit());
        module.setActive(moduleDTO.isActive());
        
        Long moduleId = moduleDAO.save(module);
        LOGGER.info(String.format("Imported module '%s' with ID %d for Course ID %d (Active: %b)", module.getModuleName(), moduleId, courseId, module.isActive()));
        
        // Import tasks
        LOGGER.info("Importing " + moduleDTO.getTasks().size() + " tasks for module ID " + moduleId);
        int tasksImported = 0;
        if (moduleDTO.getTasks() != null) {
            for (TaskDTO taskDTO : moduleDTO.getTasks()) {
                moduleImportService.importTask(taskDTO, moduleId);
                tasksImported++;
            }
        }
        LOGGER.info("Successfully imported " + tasksImported + " tasks for module ID " + moduleId);
        result.setTasksImported(tasksImported);
        
        // Import module test questions
        int questionsImported = 0;
        for (CodingQuestionDTO questionDTO : moduleDTO.getModuleTestQuestions()) {
            moduleImportService.importModuleTestQuestion(questionDTO, moduleId, courseId);
            questionsImported++;
        }
        result.setQuestionsImported(questionsImported);
        
        return result;
    }
    
    /**
     * Import course test question with test cases
     */
    private void importCourseTestQuestion(CodingQuestionDTO questionDTO, Long courseId) throws SQLException {
        CodingQuestion question = new CodingQuestion();
        question.setModuleId(null); // Course test, not module test
        question.setCourseId(courseId);
        question.setQuestionType("COURSE_TEST");
        question.setQuestionText(questionDTO.getQuestionText());
        question.setProblemStatement(questionDTO.getProblemStatement());
        question.setExpectedOutput(questionDTO.getExpectedOutput());
        question.setSampleInput(questionDTO.getSampleInput());
        question.setSampleOutput(questionDTO.getSampleOutput());
        question.setDifficulty(questionDTO.getDifficulty());
        question.setPoints(questionDTO.getPoints());
        question.setTimeLimit(questionDTO.getTimeLimit());
        question.setLanguage(questionDTO.getLanguage());
        
        Long questionId = codingQuestionDAO.save(question);
        
        // Import test cases
        for (TestCaseDTO tcDTO : questionDTO.getTestCases()) {
            TestCase testCase = new TestCase();
            testCase.setQuestionId(questionId);
            testCase.setInput(tcDTO.getInput());
            testCase.setExpectedOutput(tcDTO.getExpectedOutput());
            testCase.setSample(tcDTO.isSample());
            testCase.setOrderIndex(tcDTO.getOrderIndex());
            testCaseDAO.save(testCase);
        }
    }
}
