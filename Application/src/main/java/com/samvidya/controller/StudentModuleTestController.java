package com.samvidya.controller;

import com.samvidya.dao.CodingQuestionDAO;
import com.samvidya.dao.StudentAttemptDAO;
import com.samvidya.dao.TestCaseDAO;
import com.samvidya.model.*;
import com.samvidya.service.StudentProgressService;
import com.samvidya.util.CodeExecutor;
import javafx.application.Platform;
import javafx.collections.FXCollections;
import javafx.collections.ObservableList;
import javafx.concurrent.Task;
import javafx.fxml.FXML;
import javafx.fxml.FXMLLoader;
import javafx.scene.Parent;
import javafx.scene.Scene;
import javafx.scene.control.*;
import javafx.scene.control.cell.PropertyValueFactory;
import javafx.stage.Stage;

import java.sql.SQLException;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

public class StudentModuleTestController {

    @FXML
    private Label moduleNameLabel;

    @FXML
    private Label courseNameLabel;

    @FXML
    private Label testInfoLabel;

    @FXML
    private Label timeRemainingLabel;

    @FXML
    private Label currentQuestionLabel;

    @FXML
    private TextArea questionTextArea;

    @FXML
    private TextArea problemStatementArea;

    @FXML
    private TableView<TestCase> sampleTestCasesTable;

    @FXML
    private TableColumn<TestCase, String> sampleInputColumn;

    @FXML
    private TableColumn<TestCase, String> sampleOutputColumn;

    @FXML
    private TextArea codeArea;

    @FXML
    private Button runCodeButton;

    @FXML
    private Button nextQuestionButton;

    @FXML
    private Button previousQuestionButton;

    @FXML
    private Button submitTestButton;

    @FXML
    private TextArea outputArea;

    @FXML
    private Label statusLabel;

    @FXML
    private ProgressBar executionProgress;

    @FXML
    private ListView<String> questionsListView;

    @FXML
    private Button closeButton;

    @FXML
    private Label errorLabel;

    private User currentUser;
    private com.samvidya.model.Module currentModule;
    private Course currentCourse;
    private CodingQuestionDAO codingQuestionDAO;
    private TestCaseDAO testCaseDAO;
    private StudentAttemptDAO studentAttemptDAO;
    private StudentProgressService progressService;
    private CodeExecutor codeExecutor;
    
    private List<CodingQuestion> assignedQuestions;
    private List<String> submittedCodes;
    private int currentQuestionIndex = 0;
    private ObservableList<TestCase> sampleTestCases;
    private ObservableList<String> questionsList;

    @FXML
    private void initialize() {
        codingQuestionDAO = new CodingQuestionDAO();
        testCaseDAO = new TestCaseDAO();
        studentAttemptDAO = new StudentAttemptDAO();
        progressService = new StudentProgressService();
        codeExecutor = new CodeExecutor();
        sampleTestCases = FXCollections.observableArrayList();
        questionsList = FXCollections.observableArrayList();
        errorLabel.setVisible(false);

        // Setup sample test cases table
        sampleInputColumn.setCellValueFactory(new PropertyValueFactory<>("input"));
        sampleOutputColumn.setCellValueFactory(new PropertyValueFactory<>("expectedOutput"));
        sampleTestCasesTable.setItems(sampleTestCases);

        // Setup questions list
        questionsListView.setItems(questionsList);
        questionsListView.getSelectionModel().selectedIndexProperty().addListener((obs, oldVal, newVal) -> {
            if (newVal != null && newVal.intValue() >= 0) {
                navigateToQuestion(newVal.intValue());
            }
        });

        // Make text areas read-only except code area
        questionTextArea.setEditable(false);
        problemStatementArea.setEditable(false);
        outputArea.setEditable(false);

        // Hide progress bar initially
        executionProgress.setVisible(false);

        // Initialize navigation buttons (will be updated when questions are loaded)
        previousQuestionButton.setDisable(true);
        nextQuestionButton.setDisable(true);
        submitTestButton.setDisable(true);
    }

    public void setCurrentUser(User user) {
        this.currentUser = user;
    }

    public void setModuleAndCourse(com.samvidya.model.Module module, Course course) {
        this.currentModule = module;
        this.currentCourse = course;
        populateTestInfo();
        loadAssignedQuestions();
    }

    private void populateTestInfo() {
        if (currentModule != null && currentCourse != null) {
            moduleNameLabel.setText(currentModule.getModuleName());
            courseNameLabel.setText(currentCourse.getCourseName());
            
            // Debug logging
            System.out.println("=== MODULE TEST DEBUG INFO ===");
            System.out.println("Module ID: " + currentModule.getId());
            System.out.println("Module Name: " + currentModule.getModuleName());
            System.out.println("Module Test Questions (configured): " + currentModule.getModuleTestQuestions());
            System.out.println("Test Questions Per Module (assigned): " + currentModule.getModuleTestQuestions());
            System.out.println("Test Time Limit: " + currentModule.getTestTimeLimit());
            System.out.println("Total Test Questions Available: " + currentModule.getTotalTestQuestions());
            
            testInfoLabel.setText(String.format("Module Test - %d questions will be assigned from %d available", 
                currentModule.getModuleTestQuestions(), currentModule.getTotalTestQuestions()));
            timeRemainingLabel.setText("Time: " + currentModule.getTestTimeLimit() + " minutes");
        }
    }

    private void loadAssignedQuestions() {
        try {
            // Get student's assigned question IDs from progress
            StudentProgress progress = progressService.getModuleProgress(
                currentUser.getId(), currentCourse.getId(), currentModule.getId());
            
            List<Long> assignedQuestionIds = progress.getAssignedQuestionIds();
            
            if (assignedQuestionIds == null || assignedQuestionIds.isEmpty()) {
                // First time - assign random questions
                assignedQuestionIds = assignRandomQuestions();
                progress.setAssignedQuestionIds(assignedQuestionIds);
                // Note: In a real implementation, you'd want to save this back to the database
                // For now, we'll just use the assigned questions for this session
            }

            // Load the assigned questions
            assignedQuestions = new ArrayList<>();
            for (Long questionId : assignedQuestionIds) {
                CodingQuestion question = codingQuestionDAO.findById(questionId);
                if (question != null) {
                    assignedQuestions.add(question);
                }
            }

            System.out.println("=== LOADED QUESTIONS DEBUG ===");
            System.out.println("Assigned question IDs: " + assignedQuestionIds);
            System.out.println("Successfully loaded questions: " + assignedQuestions.size());
            for (int i = 0; i < assignedQuestions.size(); i++) {
                CodingQuestion q = assignedQuestions.get(i);
                System.out.println("Question " + (i+1) + ": ID=" + q.getId() + ", Text=" + q.getQuestionText() + ", Points=" + q.getPoints());
            }

            if (assignedQuestions.isEmpty()) {
                showError("No test questions available for this module.");
                return;
            }

            // Initialize submitted codes array
            submittedCodes = new ArrayList<>(Collections.nCopies(assignedQuestions.size(), ""));

            // Populate questions list
            questionsList.clear();
            for (int i = 0; i < assignedQuestions.size(); i++) {
                CodingQuestion q = assignedQuestions.get(i);
                questionsList.add(String.format("Q%d: %s (%d pts)", 
                    i + 1, q.getQuestionText(), q.getPoints()));
            }

            // Load first question
            currentQuestionIndex = 0;
            loadCurrentQuestion();

        } catch (Exception e) {
            e.printStackTrace();
            showError("Failed to load test questions: " + e.getMessage());
        }
    }

    private List<Long> assignRandomQuestions() throws Exception {
        // Get all module test questions for this module
        List<CodingQuestion> allQuestions = codingQuestionDAO.findModuleTests(currentModule.getId());
        
        System.out.println("=== QUESTION ASSIGNMENT DEBUG ===");
        System.out.println("Total questions available in database: " + allQuestions.size());
        System.out.println("Questions configured to assign: " + currentModule.getModuleTestQuestions());
        
        if (allQuestions.isEmpty()) {
            throw new Exception("No test questions available for this module. Please contact your instructor.");
        }
        
        int requiredQuestions = currentModule.getModuleTestQuestions(); // Use the field that exists in DB
        System.out.println("Module.getModuleTestQuestions() (from DB): " + requiredQuestions);
        System.out.println("Module.getTestQuestionsPerModule() (model default): " + currentModule.getTestQuestionsPerModule());
        if (allQuestions.size() < requiredQuestions) {
            // If not enough questions, use all available questions
            requiredQuestions = allQuestions.size();
            System.out.println("Warning: Only " + allQuestions.size() + " questions available, using all of them.");
        }

        System.out.println("Final questions to assign: " + requiredQuestions);

        // Randomly select the required number of questions
        Collections.shuffle(allQuestions);
        List<Long> selectedIds = allQuestions.stream()
            .limit(requiredQuestions)
            .map(CodingQuestion::getId)
            .collect(Collectors.toList());
            
        System.out.println("Selected question IDs: " + selectedIds);
        return selectedIds;
    }

    private void loadCurrentQuestion() {
        if (assignedQuestions == null || assignedQuestions.isEmpty() || 
            currentQuestionIndex >= assignedQuestions.size()) {
            return;
        }

        CodingQuestion question = assignedQuestions.get(currentQuestionIndex);
        
        // Update UI
        currentQuestionLabel.setText(String.format("Question %d of %d", 
            currentQuestionIndex + 1, assignedQuestions.size()));
        questionTextArea.setText(question.getQuestionText());
        problemStatementArea.setText(question.getProblemStatement());
        
        // Load saved code for this question
        String savedCode = submittedCodes.get(currentQuestionIndex);
        if (savedCode != null) {
            codeArea.setText(savedCode);
        } else {
            // Set language-specific template
            setCodeTemplate(question.getLanguage());
        }
        
        // Load sample test cases
        loadSampleTestCases(question.getId());
        
        // Update navigation
        updateNavigationButtons();
        
        // Select current question in list
        questionsListView.getSelectionModel().select(currentQuestionIndex);
        
        // Clear output
        outputArea.clear();
        statusLabel.setText("Question loaded");
    }

    private void loadSampleTestCases(Long questionId) {
        try {
            List<TestCase> testCases = testCaseDAO.findSampleTestCases(null, questionId);
            sampleTestCases.clear();
            sampleTestCases.addAll(testCases);
        } catch (Exception e) {
            e.printStackTrace();
            showError("Failed to load sample test cases: " + e.getMessage());
        }
    }

    private void updateNavigationButtons() {
        if (assignedQuestions == null || assignedQuestions.isEmpty()) {
            previousQuestionButton.setDisable(true);
            nextQuestionButton.setDisable(true);
            submitTestButton.setDisable(true);
            return;
        }
        
        previousQuestionButton.setDisable(currentQuestionIndex <= 0);
        nextQuestionButton.setDisable(currentQuestionIndex >= assignedQuestions.size() - 1);
        
        // Enable submit test button if at least one question has code
        boolean hasAnyCode = submittedCodes != null && 
            submittedCodes.stream().anyMatch(code -> !code.trim().isEmpty());
        submitTestButton.setDisable(!hasAnyCode);
    }

    @FXML
    private void handleRunCode() {
        String code = codeArea.getText().trim();
        if (code.isEmpty()) {
            showError("Please write some code first");
            return;
        }

        // Save current code
        submittedCodes.set(currentQuestionIndex, code);
        updateNavigationButtons();

        // Run code against sample test cases only
        runCodeAsync(code, true);
    }

    @FXML
    private void handlePreviousQuestion() {
        if (currentQuestionIndex > 0) {
            // Save current code
            submittedCodes.set(currentQuestionIndex, codeArea.getText());
            currentQuestionIndex--;
            loadCurrentQuestion();
        }
    }

    @FXML
    private void handleNextQuestion() {
        if (currentQuestionIndex < assignedQuestions.size() - 1) {
            // Save current code
            submittedCodes.set(currentQuestionIndex, codeArea.getText());
            currentQuestionIndex++;
            loadCurrentQuestion();
        }
    }

    private void navigateToQuestion(int index) {
        if (index >= 0 && index < assignedQuestions.size() && index != currentQuestionIndex) {
            // Save current code
            submittedCodes.set(currentQuestionIndex, codeArea.getText());
            currentQuestionIndex = index;
            loadCurrentQuestion();
        }
    }

    @FXML
    private void handleSubmitTest() {
        // Save current code
        submittedCodes.set(currentQuestionIndex, codeArea.getText());

        // Check if all questions have code
        List<Integer> emptyQuestions = new ArrayList<>();
        for (int i = 0; i < submittedCodes.size(); i++) {
            if (submittedCodes.get(i).trim().isEmpty()) {
                emptyQuestions.add(i + 1);
            }
        }

        // Confirm submission
        Alert confirmAlert = new Alert(Alert.AlertType.CONFIRMATION);
        confirmAlert.setTitle("Submit Module Test");
        confirmAlert.setHeaderText("Submit Module Test");
        
        String message = "Are you sure you want to submit your module test?";
        if (!emptyQuestions.isEmpty()) {
            message += "\n\nWarning: The following questions have no code:\n" + 
                emptyQuestions.stream().map(q -> "Question " + q).collect(Collectors.joining(", "));
        }
        confirmAlert.setContentText(message);

        if (confirmAlert.showAndWait().orElse(ButtonType.CANCEL) == ButtonType.OK) {
            submitTestAsync();
        }
    }

    private void runCodeAsync(String code, boolean sampleOnly) {
        CodingQuestion currentQuestion = assignedQuestions.get(currentQuestionIndex);
        
        // Disable buttons during execution
        runCodeButton.setDisable(true);
        executionProgress.setVisible(true);
        statusLabel.setText("Running sample test cases...");
        outputArea.clear();

        Task<CodeExecutor.TestExecutionResult> executionTask = new Task<CodeExecutor.TestExecutionResult>() {
            @Override
            protected CodeExecutor.TestExecutionResult call() throws Exception {
                List<TestCase> testCases = testCaseDAO.findSampleTestCases(null, currentQuestion.getId());
                return codeExecutor.executeWithTestCases(code, currentQuestion.getLanguage(), testCases);
            }
        };

        executionTask.setOnSucceeded(e -> {
            Platform.runLater(() -> {
                CodeExecutor.TestExecutionResult result = executionTask.getValue();
                displayExecutionResult(result, true);
                
                // Re-enable buttons
                runCodeButton.setDisable(false);
                executionProgress.setVisible(false);
            });
        });

        executionTask.setOnFailed(e -> {
            Platform.runLater(() -> {
                Throwable exception = executionTask.getException();
                showError("Execution failed: " + exception.getMessage());
                statusLabel.setText("Execution failed");
                
                // Re-enable buttons
                runCodeButton.setDisable(false);
                executionProgress.setVisible(false);
            });
        });

        Thread executionThread = new Thread(executionTask);
        executionThread.setDaemon(true);
        executionThread.start();
    }

    private void submitTestAsync() {
        // Disable all buttons during submission
        runCodeButton.setDisable(true);
        nextQuestionButton.setDisable(true);
        previousQuestionButton.setDisable(true);
        submitTestButton.setDisable(true);
        executionProgress.setVisible(true);
        statusLabel.setText("Submitting module test...");

        Task<List<CodeExecutor.TestExecutionResult>> submissionTask = new Task<List<CodeExecutor.TestExecutionResult>>() {
            @Override
            protected List<CodeExecutor.TestExecutionResult> call() throws Exception {
                List<CodeExecutor.TestExecutionResult> results = new ArrayList<>();
                
                for (int i = 0; i < assignedQuestions.size(); i++) {
                    CodingQuestion question = assignedQuestions.get(i);
                    String code = submittedCodes.get(i);
                    
                    if (code.trim().isEmpty()) {
                        // Create empty result for questions with no code
                        results.add(new CodeExecutor.TestExecutionResult(new ArrayList<>(), 0, 0, false));
                    } else {
                        // Execute all test cases for this question
                        List<TestCase> testCases = testCaseDAO.findByQuestionId(question.getId());
                        CodeExecutor.TestExecutionResult result = codeExecutor.executeWithTestCases(
                            code, question.getLanguage(), testCases);
                        results.add(result);
                    }
                }
                
                return results;
            }
        };

        submissionTask.setOnSucceeded(e -> {
            Platform.runLater(() -> {
                List<CodeExecutor.TestExecutionResult> results = submissionTask.getValue();
                processTestSubmission(results);
            });
        });

        submissionTask.setOnFailed(e -> {
            Platform.runLater(() -> {
                Throwable exception = submissionTask.getException();
                showError("Submission failed: " + exception.getMessage());
                statusLabel.setText("Submission failed");
                
                // Re-enable buttons
                runCodeButton.setDisable(false);
                nextQuestionButton.setDisable(false);
                previousQuestionButton.setDisable(false);
                submitTestButton.setDisable(false);
                executionProgress.setVisible(false);
            });
        });

        Thread submissionThread = new Thread(submissionTask);
        submissionThread.setDaemon(true);
        submissionThread.start();
    }

    private void processTestSubmission(List<CodeExecutor.TestExecutionResult> results) {
        try {
            int totalScore = 0;
            int maxScore = 0;
            int totalPointsToAdd = 0; // Track total points to add across all questions
            
            System.out.println("=== TEST SUBMISSION DEBUG ===");
            System.out.println("Number of questions submitted: " + results.size());
            
            // Calculate total scores and save individual attempts
            for (int i = 0; i < results.size(); i++) {
                CodingQuestion question = assignedQuestions.get(i);
                CodeExecutor.TestExecutionResult result = results.get(i);
                String code = submittedCodes.get(i);
                
                // Calculate actual score based on question points, not CodeExecutor's hardcoded 100
                int questionPoints = question.getPoints();
                int executionScore = result.getTotalScore();
                int executionMaxScore = result.getMaxScore();
                
                // Calculate the actual score proportionally
                int actualScore = 0;
                if (executionMaxScore > 0) {
                    // Convert execution score (0-100 scale) to question points scale
                    double percentage = (double) executionScore / executionMaxScore;
                    actualScore = (int) Math.round(percentage * questionPoints);
                }
                
                // Check for previous attempt on this question
                StudentAttempt previousAttempt = studentAttemptDAO.findLatestAttemptByStudentAndQuestion(
                    currentUser.getId(), question.getId());
                
                int previousScore = previousAttempt != null ? previousAttempt.getScore() : 0;
                int scoreToSave = Math.max(actualScore, previousScore); // Keep best score
                
                // Calculate points to add (only the difference if improved)
                int pointsToAdd = 0;
                if (previousAttempt == null) {
                    // First attempt - add full score
                    pointsToAdd = actualScore;
                } else {
                    // Subsequent attempt - add only the improvement
                    pointsToAdd = Math.max(0, actualScore - previousScore);
                }
                
                totalPointsToAdd += pointsToAdd;
                
                System.out.println("Question " + (i+1) + " (ID: " + question.getId() + "):");
                System.out.println("  - Question Points: " + questionPoints);
                System.out.println("  - Execution Score: " + executionScore + "/" + executionMaxScore);
                System.out.println("  - Execution Percentage: " + (executionMaxScore > 0 ? (double) executionScore / executionMaxScore * 100.0 : 0.0) + "%");
                System.out.println("  - Actual Score: " + actualScore + "/" + questionPoints);
                System.out.println("  - Previous Score: " + previousScore + "/" + questionPoints);
                System.out.println("  - Score to Save (Best): " + scoreToSave + "/" + questionPoints);
                System.out.println("  - Points to Add: " + pointsToAdd);
                System.out.println("  - Code Length: " + (code != null ? code.length() : 0) + " characters");
                
                totalScore += scoreToSave; // Use best score for total
                maxScore += questionPoints;
                
                // Save individual question attempt
                StudentAttempt attempt = new StudentAttempt();
                attempt.setStudentId(currentUser.getId());
                attempt.setQuestionId(question.getId());
                attempt.setModuleId(currentModule.getId());
                attempt.setCourseId(currentCourse.getId());
                attempt.setAttemptType("MODULE_TEST");
                attempt.setSubmittedCode(code);
                attempt.setExecutionResult(String.format("Score: %d/%d (%.1f%%)", 
                    actualScore, questionPoints, questionPoints > 0 ? (double) actualScore / questionPoints * 100.0 : 0.0));
                attempt.setCorrect(scoreToSave >= (questionPoints * 0.5));
                attempt.setScore(scoreToSave); // Save best score
                attempt.setMaxScore(questionPoints);
                attempt.setAttemptNumber(1);
                attempt.setStatus("COMPLETED");
                attempt.setSubmittedAt(LocalDateTime.now());
                attempt.setCompletedAt(LocalDateTime.now());
                attempt.setLatest(true);

                studentAttemptDAO.save(attempt);
            }
            
            // Update course-specific points
            com.samvidya.dao.StudentCourseProgressDAO courseProgressDAO = new com.samvidya.dao.StudentCourseProgressDAO();
            try {
                courseProgressDAO.updateCoursePoints(currentUser.getId(), currentCourse.getId());
            } catch (SQLException e) {
                System.err.println("Failed to update course points: " + e.getMessage());
            }
            
            System.out.println("=== FINAL SCORES ===");
            System.out.println("Total Score: " + totalScore);
            System.out.println("Max Possible Score: " + maxScore);
            System.out.println("Percentage: " + (maxScore > 0 ? (double) totalScore / maxScore * 100.0 : 0.0) + "%");
            System.out.println("Total Points to Add: " + totalPointsToAdd);
            
            // Update total points if there's an improvement
            if (totalPointsToAdd > 0) {
                com.samvidya.dao.UserDAO userDAO = new com.samvidya.dao.UserDAO();
                userDAO.addPoints(currentUser.getId(), totalPointsToAdd);
                System.out.println("Added " + totalPointsToAdd + " points to user's total");
            }
            
            // Update module test completion in student progress
            boolean testPassed = totalScore >= (maxScore * 0.5); // 50% to pass
            System.out.println("Test Passed: " + testPassed + " (required: 50%)");
            
            progressService.updateProgression(currentUser.getId(), currentCourse.getId(), currentModule.getId());
            
            // Show results
            displayTestResults(totalScore, maxScore, testPassed);
            
        } catch (Exception e) {
            e.printStackTrace();
            showError("Failed to save test results: " + e.getMessage());
        }
    }

    private void displayTestResults(int totalScore, int maxScore, boolean passed) {
        executionProgress.setVisible(false);
        
        Alert resultAlert = new Alert(Alert.AlertType.INFORMATION);
        resultAlert.setTitle("Module Test Results");
        resultAlert.setHeaderText("Module Test Completed");
        
        String message = String.format(
            "Your module test has been submitted successfully!\n\n" +
            "Total Score: %d/%d (%.1f%%)\n" +
            "Status: %s\n\n" +
            "You can now close this window.",
            totalScore, maxScore, 
            maxScore > 0 ? (double) totalScore / maxScore * 100.0 : 0.0,
            passed ? "PASSED" : "FAILED"
        );
        
        resultAlert.setContentText(message);
        resultAlert.showAndWait();
        
        // Close the test window
        handleClose();
    }

    private void displayExecutionResult(CodeExecutor.TestExecutionResult result, boolean sampleOnly) {
        StringBuilder output = new StringBuilder();
        output.append("=== SAMPLE TEST CASES RESULTS ===\n\n");

        for (CodeExecutor.TestCaseResult testResult : result.getTestCaseResults()) {
            TestCase testCase = testResult.getTestCase();
            CodeExecutor.ExecutionResult execResult = testResult.getExecutionResult();
            
            output.append(String.format("Test Case %d: %s\n", 
                testCase.getOrderIndex(), testResult.isPassed() ? "PASSED" : "FAILED"));
            output.append("Input: ").append(testCase.getInput()).append("\n");
            output.append("Expected: ").append(testCase.getExpectedOutput()).append("\n");
            output.append("Actual: ").append(execResult.getOutput().trim()).append("\n");
            
            if (!execResult.isSuccess()) {
                output.append("Error: ").append(execResult.getError()).append("\n");
            }
            
            output.append("\n");
        }

        outputArea.setText(output.toString());
        statusLabel.setText("Sample test cases completed");
    }

    @FXML
    private void handleClose() {
        // Confirm if test is not submitted
        if (submitTestButton.isDisable() == false) {
            Alert confirmAlert = new Alert(Alert.AlertType.CONFIRMATION);
            confirmAlert.setTitle("Close Test");
            confirmAlert.setHeaderText("Close Module Test");
            confirmAlert.setContentText("Are you sure you want to close the test? Your progress will be lost if not submitted.");
            
            if (confirmAlert.showAndWait().orElse(ButtonType.CANCEL) != ButtonType.OK) {
                return;
            }
        }
        
        Stage stage = (Stage) closeButton.getScene().getWindow();
        stage.close();
    }

    private void setCodeTemplate(String language) {
        String template;
        switch (language.toLowerCase()) {
            case "python":
                template = "# Write your Python code here\n\n";
                break;
            case "java":
                template = "public class Solution {\n" +
                          "    public static void main(String[] args) {\n" +
                          "        // Write your Java code here\n" +
                          "        \n" +
                          "    }\n" +
                          "}\n";
                break;
            case "c++":
            case "cpp":
                template = "#include <iostream>\n" +
                          "using namespace std;\n\n" +
                          "int main() {\n" +
                          "    // Write your C++ code here\n" +
                          "    \n" +
                          "    return 0;\n" +
                          "}\n";
                break;
            case "c":
                template = "#include <stdio.h>\n\n" +
                          "int main() {\n" +
                          "    // Write your C code here\n" +
                          "    \n" +
                          "    return 0;\n" +
                          "}\n";
                break;
            case "javascript":
                template = "// Write your JavaScript code here\n\n";
                break;
            default:
                template = "// Write your code here\n\n";
                break;
        }
        codeArea.setText(template);
    }

    private void showError(String message) {
        errorLabel.setText(message);
        errorLabel.setVisible(true);
    }
}