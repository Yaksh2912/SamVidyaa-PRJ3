package com.samvidya.controller;

import com.samvidya.dao.StudentAttemptDAO;
import com.samvidya.dao.TaskDAO;
import com.samvidya.dao.TestCaseDAO;
import com.samvidya.model.*;
import com.samvidya.util.CodeExecutor;
import com.samvidya.service.StudentProgressService;
import javafx.application.Platform;
import javafx.collections.FXCollections;
import javafx.collections.ObservableList;
import javafx.concurrent.Task;
import javafx.fxml.FXML;
import javafx.scene.control.*;
import javafx.scene.control.cell.PropertyValueFactory;
import javafx.stage.Stage;

import java.sql.SQLException;
import java.time.LocalDateTime;
import java.util.List;

public class StudentTaskController {

    @FXML
    private Label taskNameLabel;

    @FXML
    private Label difficultyLabel;

    @FXML
    private Label pointsLabel;

    @FXML
    private Label timeLimitLabel;

    @FXML
    private Label languageLabel;

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
    private Button submitCodeButton;

    @FXML
    private TextArea outputArea;

    @FXML
    private Label statusLabel;

    @FXML
    private ProgressBar executionProgress;

    @FXML
    private TableView<StudentAttempt> attemptsTable;

    @FXML
    private TableColumn<StudentAttempt, Integer> attemptNumberColumn;

    @FXML
    private TableColumn<StudentAttempt, Integer> scoreColumn;

    @FXML
    private TableColumn<StudentAttempt, String> statusColumn;

    @FXML
    private TableColumn<StudentAttempt, LocalDateTime> submittedAtColumn;

    @FXML
    private Button closeButton;

    @FXML
    private Label errorLabel;

    private User currentUser;
    private com.samvidya.model.Task currentTask;
    private com.samvidya.model.Module currentModule;
    private Course currentCourse;
    private TaskDAO taskDAO;
    private TestCaseDAO testCaseDAO;
    private StudentAttemptDAO studentAttemptDAO;
    private CodeExecutor codeExecutor;
    private ObservableList<TestCase> sampleTestCases;
    private ObservableList<StudentAttempt> attempts;

    @FXML
    private void initialize() {
        taskDAO = new TaskDAO();
        testCaseDAO = new TestCaseDAO();
        studentAttemptDAO = new StudentAttemptDAO();
        codeExecutor = new CodeExecutor();
        sampleTestCases = FXCollections.observableArrayList();
        attempts = FXCollections.observableArrayList();
        errorLabel.setVisible(false);

        // Setup sample test cases table
        sampleInputColumn.setCellValueFactory(new PropertyValueFactory<>("input"));
        sampleOutputColumn.setCellValueFactory(new PropertyValueFactory<>("expectedOutput"));
        sampleTestCasesTable.setItems(sampleTestCases);

        // Setup attempts table
        attemptNumberColumn.setCellValueFactory(new PropertyValueFactory<>("attemptNumber"));
        scoreColumn.setCellValueFactory(new PropertyValueFactory<>("score"));
        statusColumn.setCellValueFactory(cellData -> 
            new javafx.beans.property.SimpleStringProperty(cellData.getValue().isCorrect() ? "PASSED" : "FAILED"));
        submittedAtColumn.setCellValueFactory(new PropertyValueFactory<>("submittedAt"));
        attemptsTable.setItems(attempts);

        // Make text areas read-only except code area
        problemStatementArea.setEditable(false);
        outputArea.setEditable(false);

        // Hide progress bar initially
        executionProgress.setVisible(false);

        // Default code template will be set when task is loaded
    }

    public void setCurrentUser(User user) {
        this.currentUser = user;
    }

    public void setTask(com.samvidya.model.Task task, com.samvidya.model.Module module, Course course) {
        this.currentTask = task;
        this.currentModule = module;
        this.currentCourse = course;
        populateTaskInfo();
        loadSampleTestCases();
        loadPreviousAttempts();
    }

    private void populateTaskInfo() {
        if (currentTask != null) {
            taskNameLabel.setText(currentTask.getTaskName());
            difficultyLabel.setText(currentTask.getDifficulty());
            pointsLabel.setText(String.valueOf(currentTask.getPoints()));
            timeLimitLabel.setText(currentTask.getTimeLimit() + " minutes");
            languageLabel.setText(currentTask.getLanguage());
            problemStatementArea.setText(currentTask.getProblemStatement());

            // Set language-specific code template
            setCodeTemplate(currentTask.getLanguage());

            // Set difficulty color
            switch (currentTask.getDifficulty()) {
                case "EASY":
                    difficultyLabel.setStyle("-fx-text-fill: green;");
                    break;
                case "MEDIUM":
                    difficultyLabel.setStyle("-fx-text-fill: orange;");
                    break;
                case "HARD":
                    difficultyLabel.setStyle("-fx-text-fill: red;");
                    break;
            }
            
            // Check if task is locked (perfect score achieved)
            try {
                StudentAttempt latestAttempt = studentAttemptDAO.findLatestAttemptByStudentAndTask(
                    currentUser.getId(), currentTask.getId());
                
                if (latestAttempt != null && latestAttempt.getScore() >= latestAttempt.getMaxScore()) {
                    submitCodeButton.setDisable(true);
                    submitCodeButton.setText("Perfect Score - Locked");
                    statusLabel.setText("Perfect score achieved! Task is locked.");
                    statusLabel.setStyle("-fx-text-fill: #28a745; -fx-font-weight: bold;");
                }
            } catch (Exception e) {
                e.printStackTrace();
            }
        }
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

    private void loadSampleTestCases() {
        try {
            List<TestCase> testCases = testCaseDAO.findSampleTestCases(currentTask.getId(), null);
            sampleTestCases.clear();
            sampleTestCases.addAll(testCases);
        } catch (Exception e) {
            e.printStackTrace();
            showError("Failed to load sample test cases: " + e.getMessage());
        }
    }

    private void loadPreviousAttempts() {
        try {
            List<StudentAttempt> studentAttempts = studentAttemptDAO.findLatestByStudentAndTask(
                currentUser.getId(), currentTask.getId());
            attempts.clear();
            attempts.addAll(studentAttempts);
        } catch (Exception e) {
            e.printStackTrace();
            showError("Failed to load previous attempts: " + e.getMessage());
        }
    }

    @FXML
    private void handleRunCode() {
        String code = codeArea.getText().trim();
        if (code.isEmpty()) {
            showError("Please write some code first");
            return;
        }

        // Run code against sample test cases only
        runCodeAsync(code, true);
    }

    @FXML
    private void handleSubmitCode() {
        String code = codeArea.getText().trim();
        if (code.isEmpty()) {
            showError("Please write some code first");
            return;
        }

        // Check if task already has perfect score (100%)
        try {
            StudentAttempt latestAttempt = studentAttemptDAO.findLatestAttemptByStudentAndTask(
                currentUser.getId(), currentTask.getId());
            
            if (latestAttempt != null && latestAttempt.getScore() >= latestAttempt.getMaxScore()) {
                // Perfect score achieved - no more attempts allowed
                Alert alert = new Alert(Alert.AlertType.INFORMATION);
                alert.setTitle("Perfect Score Achieved");
                alert.setHeaderText("Task Already Completed");
                alert.setContentText("You have already achieved a perfect score (100%) on this task. No further attempts are allowed.\n\nYour score: " + 
                    latestAttempt.getScore() + "/" + latestAttempt.getMaxScore());
                alert.showAndWait();
                return;
            }
        } catch (Exception e) {
            e.printStackTrace();
            // Continue with submission if check fails
        }

        // Confirm submission
        Alert confirmAlert = new Alert(Alert.AlertType.CONFIRMATION);
        confirmAlert.setTitle("Submit Code");
        confirmAlert.setHeaderText("Submit Solution");
        confirmAlert.setContentText("Are you sure you want to submit this solution? It will be evaluated against all test cases.");

        if (confirmAlert.showAndWait().orElse(ButtonType.CANCEL) == ButtonType.OK) {
            runCodeAsync(code, false);
        }
    }

    private void runCodeAsync(String code, boolean sampleOnly) {
        // Disable buttons during execution
        runCodeButton.setDisable(true);
        submitCodeButton.setDisable(true);
        executionProgress.setVisible(true);
        statusLabel.setText(sampleOnly ? "Running sample test cases..." : "Submitting and evaluating...");
        outputArea.clear();

        Task<CodeExecutor.TestExecutionResult> executionTask = new Task<CodeExecutor.TestExecutionResult>() {
            @Override
            protected CodeExecutor.TestExecutionResult call() throws Exception {
                List<TestCase> testCases;
                if (sampleOnly) {
                    // Run only sample test cases
                    testCases = testCaseDAO.findSampleTestCases(currentTask.getId(), null);
                } else {
                    // Run all test cases (sample + validation)
                    testCases = testCaseDAO.findByTaskId(currentTask.getId());
                }

                return codeExecutor.executeWithTestCases(code, currentTask.getLanguage(), testCases);
            }
        };

        executionTask.setOnSucceeded(e -> {
            Platform.runLater(() -> {
                CodeExecutor.TestExecutionResult result = executionTask.getValue();
                displayExecutionResult(result, sampleOnly);
                
                if (!sampleOnly) {
                    // Save attempt to database
                    saveAttempt(code, result);
                }

                // Re-enable buttons
                runCodeButton.setDisable(false);
                submitCodeButton.setDisable(false);
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
                submitCodeButton.setDisable(false);
                executionProgress.setVisible(false);
            });
        });

        Thread executionThread = new Thread(executionTask);
        executionThread.setDaemon(true);
        executionThread.start();
    }

    private void displayExecutionResult(CodeExecutor.TestExecutionResult result, boolean sampleOnly) {
        StringBuilder output = new StringBuilder();
        
        if (sampleOnly) {
            output.append("=== SAMPLE TEST CASES RESULTS ===\n\n");
        } else {
            // Calculate actual score based on task points
            int taskPoints = currentTask.getPoints();
            int executionScore = result.getTotalScore();
            int executionMaxScore = result.getMaxScore();
            
            int actualScore = 0;
            if (executionMaxScore > 0) {
                double percentage = (double) executionScore / executionMaxScore;
                actualScore = (int) Math.round(percentage * taskPoints);
            }
            
            output.append("=== SUBMISSION RESULTS ===\n\n");
            output.append(String.format("Score: %d/%d (%.1f%%)\n", 
                actualScore, taskPoints, taskPoints > 0 ? (double) actualScore / taskPoints * 100.0 : 0.0));
            output.append(String.format("Status: %s\n\n", 
                result.isAllTestsPassed() ? "ALL TESTS PASSED" : "SOME TESTS FAILED"));
        }

        for (CodeExecutor.TestCaseResult testResult : result.getTestCaseResults()) {
            TestCase testCase = testResult.getTestCase();
            CodeExecutor.ExecutionResult execResult = testResult.getExecutionResult();
            
            // Only show sample test cases for run, all for submit
            if (sampleOnly && !testCase.isSample()) {
                continue;
            }

            output.append(String.format("Test Case %d (%s): %s\n", 
                testCase.getOrderIndex(),
                testCase.isSample() ? "Sample" : "Validation",
                testResult.isPassed() ? "PASSED" : "FAILED"));
            
            if (testCase.isSample() || !sampleOnly) {
                output.append("Input: ").append(testCase.getInput()).append("\n");
                output.append("Expected: ").append(testCase.getExpectedOutput()).append("\n");
                output.append("Actual: ").append(execResult.getOutput().trim()).append("\n");
                
                if (!execResult.isSuccess()) {
                    output.append("Error: ").append(execResult.getError()).append("\n");
                }
                
                if (!sampleOnly && !testCase.isSample()) {
                    output.append("Points: ").append(testResult.getScore()).append("\n");
                }
            }
            
            output.append("\n");
        }

        outputArea.setText(output.toString());
        
        if (sampleOnly) {
            statusLabel.setText("Sample test cases completed");
        } else {
            // Calculate actual score for status label
            int taskPoints = currentTask.getPoints();
            int executionScore = result.getTotalScore();
            int executionMaxScore = result.getMaxScore();
            
            int actualScore = 0;
            if (executionMaxScore > 0) {
                double percentage = (double) executionScore / executionMaxScore;
                actualScore = (int) Math.round(percentage * taskPoints);
            }
            
            statusLabel.setText(String.format("Submission completed - Score: %d/%d", 
                actualScore, taskPoints));
        }
    }

    private void saveAttempt(String code, CodeExecutor.TestExecutionResult result) {
        try {
            // Calculate actual score based on task points, not CodeExecutor's hardcoded 100
            int taskPoints = currentTask.getPoints();
            int executionScore = result.getTotalScore();
            int executionMaxScore = result.getMaxScore();
            
            // Calculate the actual score proportionally
            int actualScore = 0;
            if (executionMaxScore > 0) {
                // Convert execution score (0-100 scale) to task points scale
                double percentage = (double) executionScore / executionMaxScore;
                actualScore = (int) Math.round(percentage * taskPoints);
            }
            
            // Get previous best score
            StudentAttempt previousAttempt = studentAttemptDAO.findLatestAttemptByStudentAndTask(
                currentUser.getId(), currentTask.getId());
            
            int previousScore = previousAttempt != null ? previousAttempt.getScore() : 0;
            int scoreToSave = Math.max(actualScore, previousScore); // Keep the best score
            boolean isImprovement = actualScore > previousScore;
            
            // Calculate points to add (only the difference if improved)
            int pointsToAdd = 0;
            if (previousAttempt == null) {
                // First attempt - add full score
                pointsToAdd = actualScore;
            } else {
                // Subsequent attempt - add only the improvement
                pointsToAdd = Math.max(0, actualScore - previousScore);
            }
            
            System.out.println("=== TASK SUBMISSION DEBUG ===");
            System.out.println("Task ID: " + currentTask.getId());
            System.out.println("Task Name: " + currentTask.getTaskName());
            System.out.println("Task Points (configured): " + taskPoints);
            System.out.println("Execution Score: " + executionScore + "/" + executionMaxScore);
            System.out.println("Execution Percentage: " + (executionMaxScore > 0 ? (double) executionScore / executionMaxScore * 100.0 : 0.0) + "%");
            System.out.println("Current Attempt Score: " + actualScore + "/" + taskPoints);
            System.out.println("Previous Best Score: " + previousScore + "/" + taskPoints);
            System.out.println("Score to Save (Best): " + scoreToSave + "/" + taskPoints);
            System.out.println("Is Improvement: " + isImprovement);
            System.out.println("Points to Add: " + pointsToAdd);
            System.out.println("All Tests Passed: " + result.isAllTestsPassed());
            
            StudentAttempt attempt = new StudentAttempt();
            attempt.setStudentId(currentUser.getId());
            attempt.setTaskId(currentTask.getId());
            attempt.setModuleId(currentModule.getId());
            attempt.setCourseId(currentCourse.getId());
            attempt.setAttemptType("TASK");
            attempt.setSubmittedCode(code);
            
            // Store information about current attempt and best score
            String resultMessage = String.format("Current: %d/%d (%.1f%%), Best: %d/%d (%.1f%%), %s", 
                actualScore, taskPoints, taskPoints > 0 ? (double) actualScore / taskPoints * 100.0 : 0.0,
                scoreToSave, taskPoints, taskPoints > 0 ? (double) scoreToSave / taskPoints * 100.0 : 0.0,
                isImprovement ? "IMPROVED" : (actualScore < previousScore ? "DECLINED" : "SAME"));
            attempt.setExecutionResult(resultMessage);
            
            attempt.setCorrect(scoreToSave >= (taskPoints * 0.5)); // Based on best score
            attempt.setScore(scoreToSave); // Save the best score
            attempt.setMaxScore(taskPoints);
            attempt.setAttemptNumber(1); // Always 1 since we only store latest
            attempt.setStatus("COMPLETED");
            attempt.setSubmittedAt(LocalDateTime.now());
            attempt.setCompletedAt(LocalDateTime.now());
            attempt.setLatest(true);

            studentAttemptDAO.save(attempt);
            
            // Update course-specific points
            com.samvidya.dao.StudentCourseProgressDAO courseProgressDAO = new com.samvidya.dao.StudentCourseProgressDAO();
            try {
                courseProgressDAO.updateCoursePoints(currentUser.getId(), currentCourse.getId());
            } catch (SQLException e) {
                System.err.println("Failed to update course points: " + e.getMessage());
            }
            
            // Update total points if there's an improvement
            if (pointsToAdd > 0) {
                com.samvidya.dao.UserDAO userDAO = new com.samvidya.dao.UserDAO();
                userDAO.addPoints(currentUser.getId(), pointsToAdd);
                System.out.println("Added " + pointsToAdd + " points to user's total");
            }
            
            // Update student progress using the service with best score
            StudentProgressService progressService = new StudentProgressService();
            progressService.updateTaskCompletion(
                currentUser.getId(), 
                currentCourse.getId(), 
                currentModule.getId(), 
                currentTask.getId(),
                scoreToSave, // Use best score
                taskPoints
            );
            
            // Show feedback about score improvement/decline
            if (isImprovement) {
                statusLabel.setText(String.format("Improved! New best score: %d/%d (was %d/%d) +%d pts", 
                    scoreToSave, taskPoints, previousScore, taskPoints, pointsToAdd));
                statusLabel.setStyle("-fx-text-fill: #28a745; -fx-font-weight: bold;"); // Green
            } else if (actualScore < previousScore) {
                statusLabel.setText(String.format("Score declined. Best score remains: %d/%d (current: %d/%d)", 
                    scoreToSave, taskPoints, actualScore, taskPoints));
                statusLabel.setStyle("-fx-text-fill: #ffc107; -fx-font-weight: bold;"); // Yellow/Orange
            } else {
                statusLabel.setText(String.format("Same score: %d/%d", scoreToSave, taskPoints));
                statusLabel.setStyle("-fx-text-fill: #17a2b8; -fx-font-weight: bold;"); // Blue
            }
            
            // Refresh attempts table (now only shows latest attempt)
            loadPreviousAttempts();

        } catch (Exception e) {
            e.printStackTrace();
            showError("Failed to save attempt: " + e.getMessage());
        }
    }

    @FXML
    private void handleClose() {
        Stage stage = (Stage) closeButton.getScene().getWindow();
        stage.close();
    }

    private void showError(String message) {
        errorLabel.setText(message);
        errorLabel.setVisible(true);
    }
}