package com.samvidya.service;

import com.samvidya.dao.ModuleDAO;
import com.samvidya.dao.TaskDAO;
import com.samvidya.dao.CodingQuestionDAO;
import com.samvidya.dao.TestCaseDAO;
import com.samvidya.dto.export.*;
import com.samvidya.model.Module;
import com.samvidya.model.Task;
import com.samvidya.model.CodingQuestion;
import com.samvidya.model.TestCase;
import com.samvidya.util.ExportUtil;

import java.sql.SQLException;
import java.util.ArrayList;
import java.util.List;

public class ModuleExportService {
    private final ModuleDAO moduleDAO;
    private final TaskDAO taskDAO;
    private final CodingQuestionDAO codingQuestionDAO;
    private final TestCaseDAO testCaseDAO;
    
    public ModuleExportService() {
        this.moduleDAO = new ModuleDAO();
        this.taskDAO = new TaskDAO();
        this.codingQuestionDAO = new CodingQuestionDAO();
        this.testCaseDAO = new TestCaseDAO();
    }
    
    /**
     * Export module to ZIP file
     * @param moduleId Module ID to export
     * @param exportPath Directory path to save export
     * @return Path to created ZIP file
     */
    public String exportModule(Long moduleId, String exportPath) throws Exception {
        // 1. Fetch module data
        Module module = moduleDAO.findById(moduleId);
        if (module == null) {
            throw new IllegalArgumentException("Module not found with ID: " + moduleId);
        }
        
        // 2. Build export DTO structure
        ModuleExportDTO exportData = new ModuleExportDTO();
        exportData.setModule(convertModuleToDTO(module));
        
        // 3. Convert to JSON
        String json = ExportUtil.toJson(exportData);
        
        // 4. Create ZIP file
        String fileName = ExportUtil.generateExportFileName("module", module.getModuleName());
        return ExportUtil.createZipFile(json, "module_data.json", exportPath, fileName);
    }
    
    /**
     * Convert Module entity to DTO with all related data
     */
    public ModuleDTO convertModuleToDTO(Module module) throws SQLException {
        ModuleDTO dto = new ModuleDTO();
        
        // Set module fields
        dto.setModuleName(module.getModuleName());
        dto.setDescription(module.getDescription());
        dto.setModuleOrder(module.getModuleOrder());
        dto.setTasksPerModule(module.getTasksPerModule());
        dto.setModuleTestQuestionsCount(module.getModuleTestQuestions());
        dto.setActive(module.isActive());
        
        // Fetch and convert tasks
        List<Task> tasks = taskDAO.findByModuleId(module.getId());
        List<TaskDTO> taskDTOs = new ArrayList<>();
        for (Task task : tasks) {
            taskDTOs.add(convertTaskToDTO(task));
        }
        dto.setTasks(taskDTOs);
        
        // Fetch and convert module test questions
        List<CodingQuestion> questions = codingQuestionDAO.findModuleTests(module.getId());
        List<CodingQuestionDTO> questionDTOs = new ArrayList<>();
        for (CodingQuestion question : questions) {
            questionDTOs.add(convertQuestionToDTO(question));
        }
        dto.setModuleTestQuestions(questionDTOs);
        
        return dto;
    }
    
    /**
     * Convert Task entity to DTO with test cases
     */
    private TaskDTO convertTaskToDTO(Task task) throws SQLException {
        TaskDTO dto = new TaskDTO();
        
        // Copy task fields
        dto.setTaskName(task.getTaskName());
        dto.setDescription(task.getDescription());
        dto.setProblemStatement(task.getProblemStatement());
        dto.setDifficulty(task.getDifficulty());
        dto.setPoints(task.getPoints());
        dto.setTimeLimit(task.getTimeLimit());
        dto.setLanguage(task.getLanguage());
        
        // Fetch and convert test cases
        List<TestCase> testCases = testCaseDAO.findByTaskId(task.getId());
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
