package com.samvidya.service;

import com.samvidya.dao.ModuleDAO;
import com.samvidya.dao.TaskDAO;
import com.samvidya.dao.CodingQuestionDAO;
import com.samvidya.dao.TestCaseDAO;
import com.samvidya.dto.export.*;
import com.samvidya.model.*;
import com.samvidya.util.ExportUtil;

import java.sql.SQLException;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;
import java.util.logging.Logger;
import java.util.logging.Level;

public class ModuleImportService {
    private static final Logger LOGGER = Logger.getLogger(ModuleImportService.class.getName());
    private final ModuleDAO moduleDAO;
    private final TaskDAO taskDAO;
    private final CodingQuestionDAO codingQuestionDAO;
    private final TestCaseDAO testCaseDAO;
    
    public ModuleImportService() {
        this.moduleDAO = new ModuleDAO();
        this.taskDAO = new TaskDAO();
        this.codingQuestionDAO = new CodingQuestionDAO();
        this.testCaseDAO = new TestCaseDAO();
    }
    
    /**
     * Import module from ZIP file into target course
     * @param zipFilePath Path to ZIP file
     * @param targetCourseId Course ID to import module into
     * @return ImportResult with summary
     */
    public ImportResult importModule(String zipFilePath, Long targetCourseId) throws Exception {
        ImportResult result = new ImportResult();
        
        try {
            // 1. Read and parse ZIP file
            String json = ExportUtil.readZipFile(zipFilePath, "module_data.json");
            ModuleExportDTO exportData = ExportUtil.fromJson(json, ModuleExportDTO.class);
            
            // 2. Validate export version
            if (!"1.0".equals(exportData.getExportVersion())) {
                throw new IllegalArgumentException("Unsupported export version: " + exportData.getExportVersion());
            }
            
            // 3. Check for module name conflict and resolve
            ModuleDTO moduleDTO = exportData.getModule();
            String originalName = moduleDTO.getModuleName();
            String finalName = resolveModuleNameConflict(originalName, targetCourseId);
            
            if (!originalName.equals(finalName)) {
                result.addWarning("Module renamed from '" + originalName + "' to '" + finalName + "' due to conflict");
                moduleDTO.setModuleName(finalName);
            }
            
            // 4. Import module
            com.samvidya.model.Module module = new com.samvidya.model.Module();
            module.setCourseId(targetCourseId);
            module.setModuleName(moduleDTO.getModuleName());
            module.setDescription(moduleDTO.getDescription());
            module.setModuleOrder(getNextModuleOrder(targetCourseId));
            module.setTasksPerModule(moduleDTO.getTasksPerModule());
            module.setModuleTestQuestions(moduleDTO.getModuleTestQuestionsCount());
            module.setTestQuestionsPerModule(moduleDTO.getTestQuestionsPerModule());
            module.setTestTimeLimit(moduleDTO.getTestTimeLimit());
            module.setActive(moduleDTO.isActive());
            
            Long moduleId = moduleDAO.save(module);
            LOGGER.info(String.format("Imported module '%s' with ID %d for Course ID %d (Active: %b)", finalName, moduleId, targetCourseId, module.isActive()));
            result.setModuleId(moduleId);
            result.setModuleName(finalName);
            
            // 5. Import tasks
            LOGGER.info("Starting import of " + moduleDTO.getTasks().size() + " tasks for module ID " + moduleId);
            int tasksImported = 0;
            if (moduleDTO.getTasks() != null) {
                for (TaskDTO taskDTO : moduleDTO.getTasks()) {
                    importTask(taskDTO, moduleId);
                    tasksImported++;
                }
            }
            LOGGER.info("Successfully imported " + tasksImported + " tasks for module ID " + moduleId);
            result.setTasksImported(tasksImported);
            
            // 6. Import module test questions
            int questionsImported = 0;
            for (CodingQuestionDTO questionDTO : moduleDTO.getModuleTestQuestions()) {
                importModuleTestQuestion(questionDTO, moduleId, targetCourseId);
                questionsImported++;
            }
            result.setQuestionsImported(questionsImported);
            
            result.setSuccess(true);
            
        } catch (Exception e) {
            result.setSuccess(false);
            result.setErrorMessage(e.getMessage());
            throw e;
        }
        
        return result;
    }
    
    /**
     * Resolve module name conflict by appending suffix
     */
    private String resolveModuleNameConflict(String moduleName, Long courseId) throws SQLException {
        List<com.samvidya.model.Module> existingModules = moduleDAO.findByCourseId(courseId);
        Set<String> existingNames = existingModules.stream()
                .map(com.samvidya.model.Module::getModuleName)
                .collect(Collectors.toSet());
        
        if (!existingNames.contains(moduleName)) {
            return moduleName; // No conflict
        }
        
        // Try with suffix
        int counter = 1;
        String newName;
        do {
            newName = moduleName + " (Imported" + (counter > 1 ? " " + counter : "") + ")";
            counter++;
        } while (existingNames.contains(newName));
        
        return newName;
    }
    
    /**
     * Get next module order for course
     */
    private int getNextModuleOrder(Long courseId) throws SQLException {
        List<com.samvidya.model.Module> modules = moduleDAO.findByCourseId(courseId);
        return modules.stream()
                .mapToInt(com.samvidya.model.Module::getModuleOrder)
                .max()
                .orElse(0) + 1;
    }
    
    /**
     * Import task with test cases
     */
    public void importTask(TaskDTO taskDTO, Long moduleId) throws SQLException {
        Task task = new Task();
        task.setModuleId(moduleId);
        task.setTaskName(taskDTO.getTaskName());
        task.setDescription(taskDTO.getDescription());
        task.setProblemStatement(taskDTO.getProblemStatement());
        task.setExpectedOutput(taskDTO.getExpectedOutput());
        task.setSampleInput(taskDTO.getSampleInput());
        task.setSampleOutput(taskDTO.getSampleOutput());
        task.setDifficulty(taskDTO.getDifficulty());
        task.setPoints(taskDTO.getPoints());
        task.setTimeLimit(taskDTO.getTimeLimit());
        task.setLanguage(taskDTO.getLanguage());
        
        Long taskId = taskDAO.save(task);
        LOGGER.info(String.format("Imported task '%s' with ID %d for Module ID %d", task.getTaskName(), taskId, moduleId));
        
        // Import test cases
        if (taskDTO.getTestCases() != null) {
            LOGGER.info("Importing " + taskDTO.getTestCases().size() + " test cases for task ID " + taskId);
            for (TestCaseDTO tcDTO : taskDTO.getTestCases()) {
                TestCase testCase = new TestCase();
                testCase.setTaskId(taskId);
                testCase.setInput(tcDTO.getInput());
                testCase.setExpectedOutput(tcDTO.getExpectedOutput());
                testCase.setSample(tcDTO.isSample());
                testCase.setOrderIndex(tcDTO.getOrderIndex());
                testCaseDAO.save(testCase);
            }
        }
    }
    
    /**
     * Import module test question with test cases
     */
    public void importModuleTestQuestion(CodingQuestionDTO questionDTO, Long moduleId, 
                                        Long courseId) throws SQLException {
        CodingQuestion question = new CodingQuestion();
        question.setModuleId(moduleId);
        question.setCourseId(courseId);
        question.setQuestionType("MODULE_TEST");
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
