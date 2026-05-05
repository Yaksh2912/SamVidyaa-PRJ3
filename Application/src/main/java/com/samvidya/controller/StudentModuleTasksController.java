package com.samvidya.controller;

import com.samvidya.dao.TaskDAO;
import com.samvidya.dao.StudentAttemptDAO;
import com.samvidya.model.*;
import com.samvidya.service.StudentProgressService;
import javafx.collections.FXCollections;
import javafx.collections.ObservableList;
import javafx.fxml.FXML;
import javafx.fxml.FXMLLoader;
import javafx.scene.Parent;
import javafx.scene.Scene;
import javafx.scene.control.*;
import javafx.scene.control.cell.PropertyValueFactory;
import javafx.stage.Modality;
import javafx.stage.Modality;
import javafx.stage.Stage;

import java.util.List;

public class StudentModuleTasksController {

    @FXML
    private Label moduleNameLabel;

    @FXML
    private Label courseNameLabel;

    @FXML
    private Label tasksInfoLabel;

    @FXML
    private Label progressLabel;

    @FXML
    private ProgressBar moduleProgressBar;

    @FXML
    private TableView<TaskProgressWrapper> tasksTable;

    @FXML
    private TableColumn<TaskProgressWrapper, String> taskNameColumn;

    @FXML
    private TableColumn<TaskProgressWrapper, String> difficultyColumn;

    @FXML
    private TableColumn<TaskProgressWrapper, Integer> pointsColumn;

    @FXML
    private TableColumn<TaskProgressWrapper, Integer> timeLimitColumn;

    @FXML
    private TableColumn<TaskProgressWrapper, String> languageColumn;

    @FXML
    private TableColumn<TaskProgressWrapper, String> statusColumn;

    @FXML
    private TableColumn<TaskProgressWrapper, String> scoreColumn;

    @FXML
    private Button startTaskButton;

    @FXML
    private Button takeModuleTestButton;

    @FXML
    private Button closeButton;

    @FXML
    private Label errorLabel;

    private User currentUser;
    private com.samvidya.model.Module currentModule;
    private Course currentCourse;
    private TaskDAO taskDAO;
    private StudentAttemptDAO studentAttemptDAO;
    private StudentProgressService progressService;
    private ObservableList<TaskProgressWrapper> tasksList;

    @FXML
    private void initialize() {
        taskDAO = new TaskDAO();
        studentAttemptDAO = new StudentAttemptDAO();
        progressService = new StudentProgressService();
        tasksList = FXCollections.observableArrayList();
        errorLabel.setVisible(false);

        // Setup tasks table
        taskNameColumn.setCellValueFactory(new PropertyValueFactory<>("taskName"));
        difficultyColumn.setCellValueFactory(new PropertyValueFactory<>("difficulty"));
        pointsColumn.setCellValueFactory(new PropertyValueFactory<>("points"));
        timeLimitColumn.setCellValueFactory(new PropertyValueFactory<>("timeLimit"));
        languageColumn.setCellValueFactory(new PropertyValueFactory<>("language"));
        statusColumn.setCellValueFactory(new PropertyValueFactory<>("statusText"));
        scoreColumn.setCellValueFactory(new PropertyValueFactory<>("scoreText"));

        // Add custom cell factories for styling
        difficultyColumn.setCellFactory(column -> new TableCell<TaskProgressWrapper, String>() {
            @Override
            protected void updateItem(String item, boolean empty) {
                super.updateItem(item, empty);
                if (empty || item == null) {
                    setText(null);
                    setStyle("");
                } else {
                    setText(item);
                    switch (item) {
                        case "EASY":
                            setStyle("-fx-text-fill: #28a745; -fx-font-weight: bold;");
                            break;
                        case "MEDIUM":
                            setStyle("-fx-text-fill: #ffc107; -fx-font-weight: bold;");
                            break;
                        case "HARD":
                            setStyle("-fx-text-fill: #dc3545; -fx-font-weight: bold;");
                            break;
                        default:
                            setStyle("");
                    }
                }
            }
        });

        statusColumn.setCellFactory(column -> new TableCell<TaskProgressWrapper, String>() {
            @Override
            protected void updateItem(String item, boolean empty) {
                super.updateItem(item, empty);
                if (empty || item == null) {
                    setText(null);
                    setStyle("");
                } else {
                    setText(item);
                    TaskProgressWrapper wrapper = getTableView().getItems().get(getIndex());
                    setStyle("-fx-text-fill: " + wrapper.getStatusColor() + "; -fx-font-weight: bold;");
                }
            }
        });

        scoreColumn.setCellFactory(column -> new TableCell<TaskProgressWrapper, String>() {
            @Override
            protected void updateItem(String item, boolean empty) {
                super.updateItem(item, empty);
                if (empty || item == null) {
                    setText(null);
                    setStyle("");
                } else {
                    setText(item);
                    TaskProgressWrapper wrapper = getTableView().getItems().get(getIndex());
                    if (wrapper.isPassed()) {
                        setStyle("-fx-text-fill: #28a745; -fx-font-weight: bold;");
                    } else if (wrapper.isAttempted()) {
                        setStyle("-fx-text-fill: #dc3545; -fx-font-weight: bold;");
                    } else {
                        setStyle("-fx-text-fill: #6c757d;");
                    }
                }
            }
        });

        tasksTable.setItems(tasksList);

        // Setup table selection listener
        tasksTable.getSelectionModel().selectedItemProperty().addListener((obs, oldSelection, newSelection) -> {
            startTaskButton.setDisable(newSelection == null);
        });

        // Initially disable start button
        startTaskButton.setDisable(true);
        takeModuleTestButton.setDisable(true);
    }

    public void setCurrentUser(User user) {
        this.currentUser = user;
    }

    public void setModuleAndCourse(com.samvidya.model.Module module, Course course) {
        this.currentModule = module;
        this.currentCourse = course;
        populateModuleInfo();
        loadTasksWithProgress();
        updateModuleTestButton();
    }

    private void populateModuleInfo() {
        if (currentModule != null && currentCourse != null) {
            moduleNameLabel.setText(currentModule.getModuleName());
            courseNameLabel.setText(currentCourse.getCourseName());
            tasksInfoLabel.setText(String.format("Complete %d tasks from this module to unlock the module test", 
                currentModule.getTasksPerModule()));
        }
    }

    private void loadTasksWithProgress() {
        try {
            List<com.samvidya.model.Task> tasks = taskDAO.findByModuleId(currentModule.getId());
            tasksList.clear();
            
            for (com.samvidya.model.Task task : tasks) {
                // Get latest attempt for this task
                StudentAttempt latestAttempt = studentAttemptDAO.findLatestAttemptByStudentAndTask(
                    currentUser.getId(), task.getId());
                
                TaskProgressWrapper wrapper = new TaskProgressWrapper(task, latestAttempt);
                tasksList.add(wrapper);
            }
            
            if (tasks.isEmpty()) {
                showError("No tasks found for this module. Please contact your instructor.");
            } else {
                updateProgressDisplay();
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
                
                progressLabel.setText(String.format("Module Progress: %d/%d tasks passed (%.1f%%) - %s", 
                    passed, required, percentage, progress.getStatusDisplayText()));
                moduleProgressBar.setProgress(percentage / 100.0);
                
                // Update module test button
                takeModuleTestButton.setDisable(!progress.isCanAttemptModuleTest() || progress.isModuleTestPassed());
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

    @FXML
    private void handleStartTask() {
        TaskProgressWrapper selectedWrapper = tasksTable.getSelectionModel().getSelectedItem();
        if (selectedWrapper == null) {
            showError("Please select a task to start");
            return;
        }

        try {
            FXMLLoader loader = new FXMLLoader(getClass().getResource("/fxml/StudentTask.fxml"));
            Parent root = loader.load();

            StudentTaskController controller = loader.getController();
            controller.setCurrentUser(currentUser);
            controller.setTask(selectedWrapper.getTask(), currentModule, currentCourse);

            Stage stage = new Stage();
            stage.setTitle("Task: " + selectedWrapper.getTask().getTaskName());
            stage.setScene(new Scene(root));
            stage.getScene().getStylesheets().add(getClass().getResource("/css/style.css").toExternalForm());
            stage.initModality(Modality.WINDOW_MODAL);
            stage.initOwner(startTaskButton.getScene().getWindow());
            stage.setMaximized(true);
            
            // Refresh progress when window closes
            stage.setOnHidden(e -> {
                loadTasksWithProgress();
                updateModuleTestButton();
            });
            
            stage.show();

        } catch (Exception e) {
            e.printStackTrace();
            showError("Failed to open task: " + e.getMessage());
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
            
            // Refresh progress when window closes
            stage.setOnHidden(e -> {
                loadTasksWithProgress();
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

    // Wrapper class for displaying task with progress information
    public static class TaskProgressWrapper {
        private final com.samvidya.model.Task task;
        private final StudentAttempt latestAttempt;

        public TaskProgressWrapper(com.samvidya.model.Task task, StudentAttempt latestAttempt) {
            this.task = task;
            this.latestAttempt = latestAttempt;
        }

        public com.samvidya.model.Task getTask() { return task; }
        public StudentAttempt getLatestAttempt() { return latestAttempt; }

        public String getTaskName() { return task.getTaskName(); }
        public String getDifficulty() { return task.getDifficulty(); }
        public Integer getPoints() { return task.getPoints(); }
        public Integer getTimeLimit() { return task.getTimeLimit(); }
        public String getLanguage() { return task.getLanguage(); }

        public boolean isAttempted() { return latestAttempt != null; }
        public boolean isPassed() { 
            return latestAttempt != null && latestAttempt.getScore() >= (latestAttempt.getMaxScore() * 0.5);
        }

        public String getStatusText() {
            if (!isAttempted()) return "Not Attempted";
            if (isPassed()) return "Passed ✓";
            return "Failed ✗";
        }

        public String getStatusColor() {
            if (!isAttempted()) return "#6c757d"; // Gray
            if (isPassed()) return "#28a745"; // Green
            return "#dc3545"; // Red
        }

        public String getScoreText() {
            if (!isAttempted()) return "- / " + task.getPoints();
            return String.format("%d / %d (%.1f%%)", 
                latestAttempt.getScore(), 
                latestAttempt.getMaxScore(),
                latestAttempt.getMaxScore() > 0 ? (double) latestAttempt.getScore() / latestAttempt.getMaxScore() * 100.0 : 0.0);
        }
    }
}