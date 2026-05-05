package com.samvidya.controller;

import com.samvidya.dao.*;
import com.samvidya.model.*;
import com.samvidya.service.StudentProgressService;
import com.samvidya.util.CodeExecutor;
import javafx.application.Platform;
import javafx.geometry.Insets;
import javafx.collections.FXCollections;
import javafx.collections.ObservableList;
import javafx.concurrent.Task;
import javafx.fxml.FXML;
import javafx.fxml.FXMLLoader;
import javafx.scene.Parent;
import javafx.scene.Scene;
import javafx.scene.control.*;
import javafx.scene.control.cell.PropertyValueFactory;
import javafx.scene.layout.VBox;
import javafx.stage.Modality;
import javafx.stage.Stage;

import java.sql.SQLException;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

public class StudentModuleWorkspaceController {

    @FXML
    private Button toggleSidebarButton;

    @FXML
    private VBox sidebar;

    @FXML
    private Label moduleNameLabel;

    @FXML
    private Label courseNameLabel;

    @FXML
    private Label progressLabel;

    @FXML
    private ProgressBar moduleProgressBar;

    @FXML
    private ListView<String> tasksListView;

    @FXML
    private Label bestAttemptLabel;

    @FXML
    private Button takeModuleTestButton;

    @FXML
    private Button closeButton;

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
    private Button peerHelpButton;

    @FXML
    private TextArea outputArea;

    @FXML
    private Label statusLabel;

    @FXML
    private ProgressBar executionProgress;

    @FXML
    private Label errorLabel;

    private User currentUser;
    private com.samvidya.model.Module currentModule;
    private Course currentCourse;
    private List<com.samvidya.model.Task> allTasks;
    private Map<Long, String> taskCodeMap;
    private com.samvidya.model.Task currentTask;
    private boolean sidebarOpen = false;
    
    private TaskDAO taskDAO;
    private TestCaseDAO testCaseDAO;
    private StudentAttemptDAO studentAttemptDAO;
    private StudentProgressService progressService;
    private CodeExecutor codeExecutor;
    
    private ObservableList<String> tasksList;
    private ObservableList<TestCase> sampleTestCases;

    @FXML
    private void initialize() {
        taskDAO = new TaskDAO();
        testCaseDAO = new TestCaseDAO();
        studentAttemptDAO = new StudentAttemptDAO();
        progressService = new StudentProgressService();
        codeExecutor = new CodeExecutor();
        
        tasksList = FXCollections.observableArrayList();
        sampleTestCases = FXCollections.observableArrayList();
        taskCodeMap = new HashMap<>();
        
        errorLabel.setVisible(false);

        sampleInputColumn.setCellValueFactory(new PropertyValueFactory<>("input"));
        sampleOutputColumn.setCellValueFactory(new PropertyValueFactory<>("expectedOutput"));
        sampleTestCasesTable.setItems(sampleTestCases);

        tasksListView.setItems(tasksList);
        tasksListView.setCellFactory(lv -> new ListCell<String>() {
            @Override
            protected void updateItem(String item, boolean empty) {
                super.updateItem(item, empty);
                if (empty || item == null) {
                    setText(null);
                    setStyle("");
                } else {
                    setText(item);
                    if (item.contains("✓")) {
                        setStyle("-fx-text-fill: #28a745; -fx-font-weight: bold;");
                    } else if (item.contains("🤝")) {
                        setStyle("-fx-text-fill: #7B1FA2; -fx-font-weight: bold;");
                    } else if (item.contains("✗")) {
                        setStyle("-fx-text-fill: #dc3545;");
                    } else if (item.contains("⚠")) {
                        setStyle("-fx-text-fill: #ffc107;");
                    } else {
                        setStyle("-fx-text-fill: #6c757d;");
                    }
                }
            }
        });

        tasksListView.getSelectionModel().selectedIndexProperty().addListener((obs, oldVal, newVal) -> {
            if (newVal != null && newVal.intValue() >= 0 && newVal.intValue() < allTasks.size()) {
                loadTask(newVal.intValue());
            }
        });

        problemStatementArea.setEditable(false);
        outputArea.setEditable(false);
        executionProgress.setVisible(false);

        runCodeButton.setDisable(true);
        submitCodeButton.setDisable(true);
        takeModuleTestButton.setDisable(true);
        
        sidebar.setVisible(false);
        sidebar.setManaged(false);
    }

    public void setCurrentUser(User user) {
        this.currentUser = user;
    }

    public void setModuleAndCourse(com.samvidya.model.Module module, Course course) {
        this.currentModule = module;
        this.currentCourse = course;
        populateModuleInfo();
        loadAllTasks();
        updateModuleTestButton();
    }

    private void populateModuleInfo() {
        if (currentModule != null && currentCourse != null) {
            moduleNameLabel.setText(currentModule.getModuleName());
            courseNameLabel.setText(currentCourse.getCourseName());
        }
    }

    @FXML
    private void handleToggleSidebar() {
        sidebarOpen = !sidebarOpen;
        sidebar.setVisible(sidebarOpen);
        sidebar.setManaged(sidebarOpen);
    }

    private void loadAllTasks() {
        try {
            allTasks = taskDAO.findByModuleId(currentModule.getId());
            tasksList.clear();
            
            if (allTasks.isEmpty()) {
                showError("No tasks found for this module.");
                return;
            }

            for (int i = 0; i < allTasks.size(); i++) {
                com.samvidya.model.Task task = allTasks.get(i);
                StudentAttempt latestAttempt = studentAttemptDAO.findLatestAttemptByStudentAndTask(
                    currentUser.getId(), task.getId());
                
                String statusIcon;
                String scoreText = "";
                if (latestAttempt == null) {
                    statusIcon = "○";
                } else if (latestAttempt.getScore() >= (latestAttempt.getMaxScore() * 0.5)) {
                    if (latestAttempt.isPeerHelped()) {
                        statusIcon = "🤝";
                        scoreText = String.format(" (%d/%d, capped)", latestAttempt.getScore(), latestAttempt.getMaxScore());
                    } else {
                        statusIcon = "✓";
                        scoreText = String.format(" (%d/%d)", latestAttempt.getScore(), latestAttempt.getMaxScore());
                    }
                } else {
                    statusIcon = "✗";
                    scoreText = String.format(" (%d/%d)", latestAttempt.getScore(), latestAttempt.getMaxScore());
                }
                
                String taskItem = String.format("%s Task %d: %s%s", 
                    statusIcon, i + 1, task.getTaskName(), scoreText);
                tasksList.add(taskItem);
            }

            updateProgressDisplay();

            if (!allTasks.isEmpty()) {
                tasksListView.getSelectionModel().select(0);
                loadTask(0);
            }

        } catch (Exception e) {
            e.printStackTrace();
            showError("Failed to load tasks: " + e.getMessage());
        }
    }

    private void updateProgressDisplay() {
        try {
            StudentProgress progress = progressService.getModuleProgress(
                currentUser.getId(), currentCourse.getId(), currentModule.getId());
            
            if (progress != null) {
                int passed = progress.getTasksPassedCount();
                int required = progress.getMinTasksRequired();
                double percentage = required > 0 ? (double) passed / required * 100.0 : 0.0;
                
                progressLabel.setText(String.format("Progress: %d/%d tasks passed (%.1f%%) - %s", 
                    passed, required, percentage, progress.getStatusDisplayText()));
                moduleProgressBar.setProgress(Math.min(1.0, percentage / 100.0));
            }
        } catch (Exception e) {
            e.printStackTrace();
            progressLabel.setText("Error loading progress");
        }
    }

    private void updateModuleTestButton() {
        try {
            boolean canTakeTest = progressService.canAttemptModuleTest(
                currentUser.getId(), currentCourse.getId(), currentModule.getId());
            takeModuleTestButton.setDisable(!canTakeTest);
        } catch (Exception e) {
            e.printStackTrace();
            takeModuleTestButton.setDisable(true);
        }
    }

    private void loadTask(int taskIndex) {
        if (taskIndex < 0 || taskIndex >= allTasks.size()) {
            return;
        }

        if (currentTask != null) {
            taskCodeMap.put(currentTask.getId(), codeArea.getText());
        }

        currentTask = allTasks.get(taskIndex);
        
        taskNameLabel.setText(currentTask.getTaskName());
        difficultyLabel.setText(currentTask.getDifficulty());
        pointsLabel.setText(String.valueOf(currentTask.getPoints()));
        timeLimitLabel.setText(currentTask.getTimeLimit() + " minutes");
        languageLabel.setText(currentTask.getLanguage());
        problemStatementArea.setText(currentTask.getProblemStatement());

        switch (currentTask.getDifficulty()) {
            case "EASY":
                difficultyLabel.setStyle("-fx-text-fill: #28a745; -fx-font-weight: bold;");
                break;
            case "MEDIUM":
                difficultyLabel.setStyle("-fx-text-fill: #ffc107; -fx-font-weight: bold;");
                break;
            case "HARD":
                difficultyLabel.setStyle("-fx-text-fill: #dc3545; -fx-font-weight: bold;");
                break;
        }

        if (taskCodeMap.containsKey(currentTask.getId())) {
            codeArea.setText(taskCodeMap.get(currentTask.getId()));
        } else {
            setCodeTemplate(currentTask.getLanguage());
        }

        loadSampleTestCases();
        updateBestAttemptDisplay();

        outputArea.clear();
        statusLabel.setText("Ready");
        statusLabel.setStyle("");

        runCodeButton.setDisable(false);
        
        try {
            StudentAttempt latestAttempt = studentAttemptDAO.findLatestAttemptByStudentAndTask(
                currentUser.getId(), currentTask.getId());
            
            if (latestAttempt != null && latestAttempt.isPeerHelped()) {
                // Peer-helped: reattempt allowed but score is capped — do NOT lock submit
                submitCodeButton.setDisable(false);
                statusLabel.setText(String.format(
                    "Peer Helped: Score Capped at %d/%d",
                    latestAttempt.getScore(), latestAttempt.getMaxScore()));
                statusLabel.setStyle("-fx-text-fill: #7B1FA2; -fx-font-weight: bold;");
            } else if (latestAttempt != null && latestAttempt.getScore() >= latestAttempt.getMaxScore()) {
                // Genuine perfect score: lock the task
                submitCodeButton.setDisable(true);
                statusLabel.setText("Perfect score achieved! Task is locked.");
                statusLabel.setStyle("-fx-text-fill: #28a745; -fx-font-weight: bold;");
            } else {
                submitCodeButton.setDisable(false);
            }
        } catch (Exception e) {
            e.printStackTrace();
            submitCodeButton.setDisable(false);
        }
    }

    private void updateBestAttemptDisplay() {
        try {
            StudentAttempt latestAttempt = studentAttemptDAO.findLatestAttemptByStudentAndTask(
                currentUser.getId(), currentTask.getId());
            
            if (latestAttempt == null) {
                bestAttemptLabel.setText("No attempts yet");
                bestAttemptLabel.setStyle("-fx-text-fill: #6c757d;");
            } else {
                int score = latestAttempt.getScore();
                int maxScore = latestAttempt.getMaxScore();
                double percentage = maxScore > 0 ? (double) score / maxScore * 100.0 : 0.0;
                boolean passed = score >= (maxScore * 0.5);
                
                DateTimeFormatter formatter = DateTimeFormatter.ofPattern("MMM dd, HH:mm");
                String dateStr = latestAttempt.getSubmittedAt().format(formatter);
                
                String attemptText = String.format("Score: %d/%d (%.1f%%)\nStatus: %s\nSubmitted: %s",
                    score, maxScore, percentage,
                    passed ? "PASSED ✓" : "FAILED ✗",
                    dateStr);
                
                bestAttemptLabel.setText(attemptText);
                bestAttemptLabel.setStyle(passed ? 
                    "-fx-text-fill: #28a745; -fx-font-weight: bold;" : 
                    "-fx-text-fill: #dc3545;");
            }
        } catch (Exception e) {
            e.printStackTrace();
            bestAttemptLabel.setText("Error loading attempt");
            bestAttemptLabel.setStyle("-fx-text-fill: #dc3545;");
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

    @FXML
    private void handleRunCode() {
        String code = codeArea.getText().trim();
        if (code.isEmpty()) {
            showError("Please write some code first");
            return;
        }

        taskCodeMap.put(currentTask.getId(), code);
        runCodeAsync(code, true);
    }

    @FXML
    private void handleSubmitCode() {
        String code = codeArea.getText().trim();
        if (code.isEmpty()) {
            showError("Please write some code first");
            return;
        }

        taskCodeMap.put(currentTask.getId(), code);

        try {
            StudentAttempt latestAttempt = studentAttemptDAO.findLatestAttemptByStudentAndTask(
                currentUser.getId(), currentTask.getId());
            
            if (latestAttempt != null && latestAttempt.getScore() >= latestAttempt.getMaxScore()) {
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
        }

        Alert confirmAlert = new Alert(Alert.AlertType.CONFIRMATION);
        confirmAlert.setTitle("Submit Code");
        confirmAlert.setHeaderText("Submit Solution");
        confirmAlert.setContentText("Are you sure you want to submit this solution? It will be evaluated against all test cases.");

        if (confirmAlert.showAndWait().orElse(ButtonType.CANCEL) == ButtonType.OK) {
            runCodeAsync(code, false);
        }
    }

    private void runCodeAsync(String code, boolean sampleOnly) {
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
                    testCases = testCaseDAO.findSampleTestCases(currentTask.getId(), null);
                } else {
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
                    saveAttempt(code, result);
                }

                runCodeButton.setDisable(false);
                
                try {
                    StudentAttempt latestAttempt = studentAttemptDAO.findLatestAttemptByStudentAndTask(
                        currentUser.getId(), currentTask.getId());
                    
                    if (latestAttempt != null && latestAttempt.getScore() >= latestAttempt.getMaxScore()) {
                        submitCodeButton.setDisable(true);
                    } else {
                        submitCodeButton.setDisable(false);
                    }
                } catch (Exception ex) {
                    submitCodeButton.setDisable(false);
                }
                
                executionProgress.setVisible(false);
            });
        });

        executionTask.setOnFailed(e -> {
            Platform.runLater(() -> {
                Throwable exception = executionTask.getException();
                showError("Execution failed: " + exception.getMessage());
                statusLabel.setText("Execution failed");
                
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
            }
            
            output.append("\n");
        }

        outputArea.setText(output.toString());
        
        if (sampleOnly) {
            statusLabel.setText("Sample test cases completed");
        } else {
            int taskPoints = currentTask.getPoints();
            int executionScore = result.getTotalScore();
            int executionMaxScore = result.getMaxScore();
            
            int actualScore = 0;
            if (executionMaxScore > 0) {
                double percentage = (double) executionScore / executionMaxScore;
                actualScore = (int) Math.round(percentage * taskPoints);
            }
            
            statusLabel.setText(String.format("Submission completed - Score: %d/%d", actualScore, taskPoints));
        }
    }

    private void saveAttempt(String code, CodeExecutor.TestExecutionResult result) {
        try {
            int taskPoints = currentTask.getPoints();
            int executionScore = result.getTotalScore();
            int executionMaxScore = result.getMaxScore();
            
            int actualScore = 0;
            if (executionMaxScore > 0) {
                double percentage = (double) executionScore / executionMaxScore;
                actualScore = (int) Math.round(percentage * taskPoints);
            }
            
            StudentAttempt previousAttempt = studentAttemptDAO.findLatestAttemptByStudentAndTask(
                currentUser.getId(), currentTask.getId());
            
            int previousScore = previousAttempt != null ? previousAttempt.getScore() : 0;
            // If previous attempt was peer-helped, cap score — student cannot exceed peer-help score
            boolean capAtPeerScore = previousAttempt != null && previousAttempt.isPeerHelped();
            int scoreToSave = capAtPeerScore
                ? Math.min(actualScore, previousScore)   // capped at peer-help score
                : Math.max(actualScore, previousScore);  // normal best-score logic
            boolean isImprovement = scoreToSave > previousScore;
            
            int pointsToAdd = 0;
            if (previousAttempt == null) {
                pointsToAdd = actualScore;
            } else {
                pointsToAdd = Math.max(0, scoreToSave - previousScore);
            }
            
            StudentAttempt attempt = new StudentAttempt();
            attempt.setStudentId(currentUser.getId());
            attempt.setTaskId(currentTask.getId());
            attempt.setModuleId(currentModule.getId());
            attempt.setCourseId(currentCourse.getId());
            attempt.setAttemptType("TASK");
            attempt.setSubmittedCode(code);
            
            String resultMessage = String.format("Current: %d/%d (%.1f%%), Best: %d/%d (%.1f%%), %s", 
                actualScore, taskPoints, taskPoints > 0 ? (double) actualScore / taskPoints * 100.0 : 0.0,
                scoreToSave, taskPoints, taskPoints > 0 ? (double) scoreToSave / taskPoints * 100.0 : 0.0,
                isImprovement ? "IMPROVED" : (actualScore < previousScore ? "DECLINED" : "SAME"));
            attempt.setExecutionResult(resultMessage);
            
            attempt.setCorrect(scoreToSave >= (taskPoints * 0.5));
            attempt.setScore(scoreToSave);
            attempt.setMaxScore(taskPoints);
            attempt.setAttemptNumber(1);
            attempt.setStatus("COMPLETED");
            // Preserve the peer-helped flag: if previous was peer-helped, this self-attempt
            // is still "under the peer-help cap" — mark it so the cap survives future reattempts
            attempt.setPeerHelped(capAtPeerScore);
            attempt.setPeerHelpRequestId(capAtPeerScore && previousAttempt != null
                ? previousAttempt.getPeerHelpRequestId() : null);
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
            
            if (pointsToAdd > 0) {
                com.samvidya.dao.UserDAO userDAO = new com.samvidya.dao.UserDAO();
                userDAO.addPoints(currentUser.getId(), pointsToAdd);
            }
            
            progressService.updateTaskCompletion(
                currentUser.getId(), 
                currentCourse.getId(), 
                currentModule.getId(), 
                currentTask.getId(),
                scoreToSave,
                taskPoints
            );
            
            if (capAtPeerScore) {
                statusLabel.setText(String.format(
                    "Score capped at peer-help score: %d/%d (your attempt: %d/%d)",
                    scoreToSave, taskPoints, actualScore, taskPoints));
                statusLabel.setStyle("-fx-text-fill: #7B1FA2; -fx-font-weight: bold;");
            } else if (isImprovement) {
                statusLabel.setText(String.format("Improved! New best score: %d/%d (was %d/%d) +%d pts", 
                    scoreToSave, taskPoints, previousScore, taskPoints, pointsToAdd));
                statusLabel.setStyle("-fx-text-fill: #28a745; -fx-font-weight: bold;");
            } else if (actualScore < previousScore) {
                statusLabel.setText(String.format("Score declined. Best score remains: %d/%d (current: %d/%d)", 
                    scoreToSave, taskPoints, actualScore, taskPoints));
                statusLabel.setStyle("-fx-text-fill: #ffc107; -fx-font-weight: bold;");
            } else {
                statusLabel.setText(String.format("Same score: %d/%d", scoreToSave, taskPoints));
                statusLabel.setStyle("-fx-text-fill: #17a2b8; -fx-font-weight: bold;");
            }
            
            updateBestAttemptDisplay();
            
            int currentIndex = tasksListView.getSelectionModel().getSelectedIndex();
            loadAllTasks();
            tasksListView.getSelectionModel().select(currentIndex);
            
            updateModuleTestButton();

        } catch (Exception e) {
            e.printStackTrace();
            showError("Failed to save attempt: " + e.getMessage());
        }
    }

    @FXML
    private void handlePeerHelp() {
        if (currentTask == null) {
            showError("Select a task first before requesting peer help.");
            return;
        }

        try {
            // Check if task already has a peer-helped passing attempt — warn user
            StudentAttempt latest = studentAttemptDAO.findLatestAttemptByStudentAndTask(
                currentUser.getId(), currentTask.getId());
            if (latest != null && latest.isPeerHelped() && latest.getScore() >= latest.getMaxScore() * 0.5) {
                Alert warn = new Alert(Alert.AlertType.CONFIRMATION,
                    "This task was already passed via peer help (score: " +
                    latest.getScore() + "/" + latest.getMaxScore() + ").\n\n" +
                    "You can reattempt it yourself, but your score cannot exceed " +
                    latest.getScore() + " pts (the peer-help score).\n\n" +
                    "Do you still want to request peer help again?",
                    ButtonType.YES, ButtonType.NO);
                warn.setTitle("Task Already Peer-Helped");
                warn.setHeaderText(null);
                if (warn.showAndWait().orElse(ButtonType.NO) != ButtonType.YES) return;
            }

            // Dialog: enter enrollment number or email — use a resizable Dialog for readable warning
            Dialog<String> dialog = new Dialog<>();
            dialog.setTitle("Request Peer Help");
            dialog.setHeaderText("Task: " + currentTask.getTaskName());
            dialog.getDialogPane().setPrefWidth(520);

            javafx.scene.layout.VBox content = new javafx.scene.layout.VBox(12);
            content.setPadding(new javafx.geometry.Insets(10));

            // Warning label — shown always, emphasised if task already has a peer-helped attempt
            String warningText = "⚠  If the peer successfully completes this task, your score will be\n" +
                "set to 50% of what they earn and FROZEN — you can still reattempt\n" +
                "the task yourself but your score cannot increase beyond that value.";
            javafx.scene.control.Label warningLabel = new javafx.scene.control.Label(warningText);
            warningLabel.setWrapText(true);
            warningLabel.setStyle("-fx-text-fill: #b71c1c; -fx-font-size: 13px; " +
                "-fx-background-color: #FFEBEE; -fx-padding: 8; -fx-background-radius: 4;");

            javafx.scene.control.Label inputLabel = new javafx.scene.control.Label(
                "Enter peer's enrollment number or email:");
            javafx.scene.control.TextField inputField = new javafx.scene.control.TextField();
            inputField.setPromptText("e.g. 230694 or peer@example.com");
            inputField.setPrefWidth(460);

            content.getChildren().addAll(warningLabel, inputLabel, inputField);
            dialog.getDialogPane().setContent(content);
            dialog.getDialogPane().getButtonTypes().addAll(ButtonType.OK, ButtonType.CANCEL);

            dialog.setResultConverter(bt -> bt == ButtonType.OK ? inputField.getText().trim() : null);

            String input = dialog.showAndWait().orElse(null);
            if (input == null || input.isEmpty()) return;

            // Look up the peer
            UserDAO userDAO = new UserDAO();
            User peer = userDAO.findByEnrollmentNumber(input);
            if (peer == null) peer = userDAO.findByEmail(input);
            if (peer == null) {
                showError("No student found with that enrollment number or email.");
                return;
            }
            if (peer.getId().equals(currentUser.getId())) {
                showError("You cannot request help from yourself.");
                return;
            }
            if (!"STUDENT".equals(peer.getRole())) {
                showError("Peer help can only be requested from other students.");
                return;
            }

            // Validate peer has access to this course
            PeerHelpDAO peerHelpDAO = new PeerHelpDAO();
            if (!peerHelpDAO.peerHasCourseAccess(peer.getId(), currentCourse.getId())) {
                showError(peer.getFullName() + " does not have access to this course.");
                return;
            }

            if (peerHelpDAO.hasActiveRequest(currentUser.getId(), currentTask.getId())) {
                showError("You already have an active peer help request for this task.");
                return;
            }

            PeerHelpRequest req = new PeerHelpRequest();
            req.setRequesterId(currentUser.getId());
            req.setHelperId(peer.getId());
            req.setCourseId(currentCourse.getId());
            req.setModuleId(currentModule.getId());
            req.setTaskId(currentTask.getId());
            peerHelpDAO.createRequest(req);

            // Start polling for completion on requester's side
            startPeerHelpResultPolling(req.getId(), peer.getFullName());

            Alert sent = new Alert(Alert.AlertType.INFORMATION,
                "Peer help request sent to " + peer.getFullName() + ".\n" +
                "They have 1 minute to accept. This screen will update automatically when they complete the task.");
            sent.setTitle("Request Sent");
            sent.setHeaderText(null);
            sent.showAndWait();

        } catch (Exception e) {
            e.printStackTrace();
            showError("Failed to send peer help request: " + e.getMessage());
        }
    }

    private javafx.animation.Timeline peerResultPoller;

    private void startPeerHelpResultPolling(long requestId, String helperName) {
        if (peerResultPoller != null) peerResultPoller.stop();
        final long taskId = currentTask.getId();
        peerResultPoller = new javafx.animation.Timeline(
            new javafx.animation.KeyFrame(javafx.util.Duration.seconds(4), e -> {
                try {
                    PeerHelpDAO dao = new PeerHelpDAO();
                    PeerHelpRequest completed = dao.findCompletedForRequester(currentUser.getId(), taskId);
                    if (completed != null) {
                        peerResultPoller.stop();
                        peerResultPoller = null;
                        javafx.application.Platform.runLater(() -> onPeerHelpCompleted(completed, helperName));
                    }
                } catch (Exception ex) {
                    ex.printStackTrace();
                }
            })
        );
        peerResultPoller.setCycleCount(javafx.animation.Animation.INDEFINITE);
        peerResultPoller.play();
    }

    private void onPeerHelpCompleted(PeerHelpRequest completed, String helperName) {
        try {
            // Reload the latest attempt (which now has the helper's code and score)
            StudentAttempt latest = studentAttemptDAO.findLatestAttemptByStudentAndTask(
                currentUser.getId(), completed.getTaskId());

            if (latest != null) {
                // Show helper's code in the editor
                codeArea.setText(latest.getSubmittedCode());

                // Update status label
                boolean passed = latest.getScore() >= latest.getMaxScore() * 0.5;
                statusLabel.setText(String.format(
                    "Peer help by %s — Score: %d/%d (%s) | You can reattempt but score is capped at %d",
                    helperName, latest.getScore(), latest.getMaxScore(),
                    passed ? "PASSED ✓" : "FAILED ✗", latest.getScore()));
                statusLabel.setStyle(passed
                    ? "-fx-text-fill: #28a745; -fx-font-weight: bold;"
                    : "-fx-text-fill: #dc3545; -fx-font-weight: bold;");

                // Refresh task list and progress
                int currentIndex = tasksListView.getSelectionModel().getSelectedIndex();
                loadAllTasks();
                tasksListView.getSelectionModel().select(currentIndex);
                updateBestAttemptDisplay();
                updateModuleTestButton();
            }

            Alert notify = new Alert(Alert.AlertType.INFORMATION,
                helperName + " completed the task on your behalf!\n\n" +
                "Score: " + (latest != null ? latest.getScore() + "/" + latest.getMaxScore() : "N/A") + "\n" +
                "Their code has been loaded into the editor.\n\n" +
                "You can reattempt this task yourself, but your score cannot exceed the peer-help score.");
            notify.setTitle("Peer Help Complete");
            notify.setHeaderText(null);
            notify.showAndWait();

        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    @FXML
    private void handleTakeModuleTest() {
        try {
            boolean canTakeTest = progressService.canAttemptModuleTest(
                currentUser.getId(), currentCourse.getId(), currentModule.getId());
            
            if (!canTakeTest) {
                showError("Module test is not available. Complete the required tasks first.");
                return;
            }

            FXMLLoader loader = new FXMLLoader(getClass().getResource("/fxml/StudentModuleTest.fxml"));
            Parent root = loader.load();

            StudentModuleTestController controller = loader.getController();
            controller.setCurrentUser(currentUser);
            controller.setModuleAndCourse(currentModule, currentCourse);

            Stage stage = new Stage();
            stage.setTitle("Module Test - " + currentModule.getModuleName());
            stage.setScene(new Scene(root));
            stage.getScene().getStylesheets().add(getClass().getResource("/css/style.css").toExternalForm());
            stage.initModality(Modality.WINDOW_MODAL);
            stage.initOwner(takeModuleTestButton.getScene().getWindow());
            stage.setMaximized(true);
            
            stage.setOnHidden(e -> {
                loadAllTasks();
                updateModuleTestButton();
            });
            
            stage.show();

        } catch (Exception e) {
            e.printStackTrace();
            showError("Failed to start module test: " + e.getMessage());
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
