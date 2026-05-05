package com.samvidya.controller;

import com.samvidya.dao.CourseDAO;
import com.samvidya.dao.ModuleDAO;
import com.samvidya.dao.TaskDAO;
import com.samvidya.model.Course;
import com.samvidya.model.Module;
import com.samvidya.model.StudentCourseProgress;
import com.samvidya.model.StudentProgress;
import com.samvidya.model.User;
import com.samvidya.service.StudentProgressService;
import javafx.collections.FXCollections;
import javafx.collections.ObservableList;
import javafx.fxml.FXML;
import javafx.fxml.FXMLLoader;
import javafx.scene.Parent;
import javafx.scene.Scene;
import javafx.scene.control.*;
import javafx.scene.control.cell.PropertyValueFactory;
import javafx.stage.Stage;

import java.util.List;
public class CourseOverviewController {

    @FXML
    private Label courseNameLabel;

    @FXML
    private Label courseCodeLabel;

    @FXML
    private Label subjectLabel;

    @FXML
    private Label instructorLabel;

    @FXML
    private TextArea descriptionArea;

    @FXML
    private Label totalModulesLabel;

    @FXML
    private Label totalTasksLabel;

    @FXML
    private Label courseTestQuestionsLabel;

    @FXML
    private Label statusLabel;

    @FXML
    private Label progressLabel;

    @FXML
    private ProgressBar courseProgressBar;

    @FXML
    private TableView<ModuleProgressWrapper> modulesTable;

    @FXML
    private TableColumn<ModuleProgressWrapper, String> moduleNameColumn;

    @FXML
    private TableColumn<ModuleProgressWrapper, Integer> moduleOrderColumn;

    @FXML
    private TableColumn<ModuleProgressWrapper, String> statusColumn;

    @FXML
    private TableColumn<ModuleProgressWrapper, String> progressColumn;

    @FXML
    private TableColumn<ModuleProgressWrapper, String> accessColumn;

    @FXML
    private Button startModuleButton;

    @FXML
    private Button takeModuleTestButton;

    @FXML
    private Button takeCourseTestButton;

    @FXML
    private Button closeButton;

    @FXML
    private Label errorLabel;

    private User currentUser;
    private Course currentCourse;
    private CourseDAO courseDAO;
    private ModuleDAO moduleDAO;
    private TaskDAO taskDAO;
    private StudentProgressService progressService;
    private ObservableList<ModuleProgressWrapper> modulesList;

    @FXML
    private void initialize() {
        courseDAO = new CourseDAO();
        moduleDAO = new ModuleDAO();
        taskDAO = new TaskDAO();
        progressService = new StudentProgressService();
        modulesList = FXCollections.observableArrayList();
        errorLabel.setVisible(false);

        // Setup modules table
        moduleNameColumn.setCellValueFactory(new PropertyValueFactory<>("moduleName"));
        moduleOrderColumn.setCellValueFactory(new PropertyValueFactory<>("moduleOrder"));
        statusColumn.setCellValueFactory(new PropertyValueFactory<>("statusText"));
        progressColumn.setCellValueFactory(new PropertyValueFactory<>("progressText"));
        accessColumn.setCellValueFactory(new PropertyValueFactory<>("accessText"));

        // Add custom cell factories for styling
        statusColumn.setCellFactory(column -> new TableCell<ModuleProgressWrapper, String>() {
            @Override
            protected void updateItem(String item, boolean empty) {
                super.updateItem(item, empty);
                if (empty || item == null) {
                    setText(null);
                    setStyle("");
                } else {
                    setText(item);
                    ModuleProgressWrapper wrapper = getTableView().getItems().get(getIndex());
                    setStyle("-fx-text-fill: " + wrapper.getStatusColor() + "; -fx-font-weight: bold;");
                }
            }
        });

        accessColumn.setCellFactory(column -> new TableCell<ModuleProgressWrapper, String>() {
            @Override
            protected void updateItem(String item, boolean empty) {
                super.updateItem(item, empty);
                if (empty || item == null) {
                    setText(null);
                    setStyle("");
                } else {
                    setText(item);
                    ModuleProgressWrapper wrapper = getTableView().getItems().get(getIndex());
                    if ("Locked".equals(item)) {
                        setStyle("-fx-text-fill: #dc3545; -fx-font-weight: bold;"); // Red
                    } else if ("Available".equals(item)) {
                        setStyle("-fx-text-fill: #17a2b8; -fx-font-weight: bold;"); // Blue
                    } else if ("Completed".equals(item)) {
                        setStyle("-fx-text-fill: #28a745; -fx-font-weight: bold;"); // Green
                    } else {
                        setStyle("-fx-text-fill: #6c757d;"); // Gray
                    }
                }
            }
        });

        modulesTable.setItems(modulesList);

        // Make description area read-only
        descriptionArea.setEditable(false);

        // Setup table selection listener
        modulesTable.getSelectionModel().selectedItemProperty().addListener((obs, oldSelection, newSelection) -> {
            updateButtonStates(newSelection);
        });

        // Initially disable buttons
        startModuleButton.setDisable(true);
        takeModuleTestButton.setDisable(true);
        takeCourseTestButton.setDisable(true);
    }

    public void setCurrentUser(User user) {
        this.currentUser = user;
    }

    public void setCourse(Course course) {
        this.currentCourse = course;
        populateCourseInfo();
        loadModulesWithProgress();
        calculateStatistics();
        updateCourseTestButton();
    }

    private void populateCourseInfo() {
        if (currentCourse != null) {
            courseNameLabel.setText(currentCourse.getCourseName());
            courseCodeLabel.setText(currentCourse.getCourseCode());
            subjectLabel.setText(currentCourse.getSubject());
            instructorLabel.setText(currentCourse.getInstructorName());
            descriptionArea.setText(currentCourse.getDescription());
            courseTestQuestionsLabel.setText(String.valueOf(currentCourse.getCourseTestQuestions()));
            
            // Update status based on course completion
            try {
                StudentProgressService.CourseCompletionSummary summary = 
                    progressService.getCourseCompletionSummary(currentUser.getId(), currentCourse.getId());
                
                if (summary.isCourseTestCompleted() && summary.isCourseTestPassed()) {
                    statusLabel.setText("Passed");
                    statusLabel.setStyle("-fx-text-fill: #28a745; -fx-font-weight: bold;"); // Green
                } else if (summary.isCourseTestCompleted() && !summary.isCourseTestPassed()) {
                    statusLabel.setText("Failed");
                    statusLabel.setStyle("-fx-text-fill: #dc3545; -fx-font-weight: bold;"); // Red
                } else if (currentCourse.isActive()) {
                    statusLabel.setText("Active");
                    statusLabel.setStyle("-fx-text-fill: #17a2b8; -fx-font-weight: bold;"); // Blue
                } else {
                    statusLabel.setText("Inactive");
                    statusLabel.setStyle("-fx-text-fill: #6c757d; -fx-font-weight: bold;"); // Gray
                }
            } catch (Exception e) {
                // Fallback to original logic if progress service fails
                statusLabel.setText(currentCourse.isActive() ? "Active" : "Inactive");
                statusLabel.setStyle(currentCourse.isActive() ? "-fx-text-fill: #17a2b8;" : "-fx-text-fill: #6c757d;");
            }
        }
    }

    private void loadModulesWithProgress() {
        try {
            // Initialize course progress if needed
            progressService.initializeCourseProgress(currentUser.getId(), currentCourse.getId());
            
            List<Module> modules = moduleDAO.findByCourseId(currentCourse.getId());
            List<StudentProgress> progressList = progressService.getAllModuleProgress(currentUser.getId(), currentCourse.getId());
            
            modulesList.clear();
            
            // Add regular modules
            for (Module module : modules) {
                if (!module.isActive()) continue;
                
                StudentProgress progress = progressList.stream()
                    .filter(p -> p.getModuleId().equals(module.getId()))
                    .findFirst()
                    .orElse(null);
                
                boolean canAccess = progressService.canAccessModule(currentUser.getId(), currentCourse.getId(), module.getModuleOrder());
                
                ModuleProgressWrapper wrapper = new ModuleProgressWrapper(module, progress, canAccess);
                modulesList.add(wrapper);
            }
            
            // Add Final Test row
            StudentProgressService.CourseCompletionSummary courseProgress = 
                progressService.getCourseCompletionSummary(currentUser.getId(), currentCourse.getId());
            
            ModuleProgressWrapper finalTestWrapper = new ModuleProgressWrapper(courseProgress, currentCourse);
            modulesList.add(finalTestWrapper);
            
        } catch (Exception e) {
            e.printStackTrace();
            showError("Failed to load module progress: " + e.getMessage());
        }
    }

    private void calculateStatistics() {
        try {
            StudentProgressService.CourseCompletionSummary summary = 
                progressService.getCourseCompletionSummary(currentUser.getId(), currentCourse.getId());
            
            totalModulesLabel.setText(String.valueOf(summary.getTotalModules()));
            
            int totalTasks = 0;
            for (ModuleProgressWrapper wrapper : modulesList) {
                // Skip Final Test row (it doesn't have a module)
                if (!wrapper.isFinalTest() && wrapper.getModule() != null) {
                    totalTasks += taskDAO.countByModuleId(wrapper.getModule().getId());
                }
            }
            totalTasksLabel.setText(String.valueOf(totalTasks));
            
            // Update progress display
            double progressPercentage = summary.getOverallProgressPercentage();
            progressLabel.setText(String.format("Course Progress: %d/%d modules completed (%.1f%%)", 
                summary.getModulesCompleted(), summary.getTotalModules(), progressPercentage));
            courseProgressBar.setProgress(progressPercentage / 100.0);

        } catch (Exception e) {
            e.printStackTrace();
            totalModulesLabel.setText("Error");
            totalTasksLabel.setText("Error");
            progressLabel.setText("Error loading progress");
        }
    }

    private void updateButtonStates(ModuleProgressWrapper selectedWrapper) {
        if (selectedWrapper == null) {
            startModuleButton.setDisable(true);
            takeModuleTestButton.setDisable(true);
            return;
        }

        try {
            if (selectedWrapper.isFinalTest()) {
                // Final Test row selected - disable module buttons
                startModuleButton.setDisable(true);
                takeModuleTestButton.setDisable(true);
                return;
            }
            
            Module selectedModule = selectedWrapper.getModule();
            StudentProgress progress = selectedWrapper.getProgress();
            
            // Start Module button - enabled if module is accessible (even if completed)
            // This allows students to complete remaining tasks after passing module test
            boolean canStartModule = selectedWrapper.isCanAccess();
            startModuleButton.setDisable(!canStartModule);
            
            // Module Test button - enabled if student can attempt module test
            boolean canTakeModuleTest = progress != null && 
                progressService.canAttemptModuleTest(currentUser.getId(), currentCourse.getId(), selectedModule.getId());
            takeModuleTestButton.setDisable(!canTakeModuleTest);
            
        } catch (Exception e) {
            e.printStackTrace();
            startModuleButton.setDisable(true);
            takeModuleTestButton.setDisable(true);
        }
    }

    private void updateCourseTestButton() {
        try {
            boolean canTakeCourseTest = progressService.canAttemptCourseTest(currentUser.getId(), currentCourse.getId());
            takeCourseTestButton.setDisable(!canTakeCourseTest);
        } catch (Exception e) {
            e.printStackTrace();
            takeCourseTestButton.setDisable(true);
        }
    }

    @FXML
    private void handleStartModule() {
        ModuleProgressWrapper selectedWrapper = modulesTable.getSelectionModel().getSelectedItem();
        if (selectedWrapper == null) {
            showError("Please select a module to start");
            return;
        }

        if (selectedWrapper.isFinalTest()) {
            showError("Please use the 'Take Course Test' button for the final test");
            return;
        }

        if (!selectedWrapper.isCanAccess()) {
            showError("This module is locked. Complete previous modules first.");
            return;
        }

        try {
            FXMLLoader loader = new FXMLLoader(getClass().getResource("/fxml/StudentModuleWorkspace.fxml"));
            Parent root = loader.load();

            StudentModuleWorkspaceController controller = loader.getController();
            controller.setCurrentUser(currentUser);
            controller.setModuleAndCourse(selectedWrapper.getModule(), currentCourse);

            Stage stage = new Stage();
            stage.setTitle("Module Workspace - " + selectedWrapper.getModule().getModuleName());
            stage.setScene(new Scene(root));
            stage.getScene().getStylesheets().add(getClass().getResource("/css/style.css").toExternalForm());
            stage.setMaximized(true);
            
            // Refresh progress when window closes
            stage.setOnHidden(e -> {
                loadModulesWithProgress();
                calculateStatistics();
                updateCourseTestButton();
            });
            
            stage.show();

        } catch (Exception e) {
            e.printStackTrace();
            showError("Failed to open module workspace: " + e.getMessage());
        }
    }

    @FXML
    private void handleTakeModuleTest() {
        ModuleProgressWrapper selectedWrapper = modulesTable.getSelectionModel().getSelectedItem();
        if (selectedWrapper == null) {
            showError("Please select a module for the test");
            return;
        }

        if (selectedWrapper.isFinalTest()) {
            showError("Please use the 'Take Course Test' button for the final test");
            return;
        }

        try {
            boolean canTakeTest = progressService.canAttemptModuleTest(
                currentUser.getId(), currentCourse.getId(), selectedWrapper.getModule().getId());
            
            if (!canTakeTest) {
                showError("Module test is not available. Complete the required tasks first.");
                return;
            }

            FXMLLoader loader = new FXMLLoader(getClass().getResource("/fxml/StudentModuleTest.fxml"));
            Parent root = loader.load();

            StudentModuleTestController controller = loader.getController();
            controller.setCurrentUser(currentUser);
            controller.setModuleAndCourse(selectedWrapper.getModule(), currentCourse);

            Stage stage = new Stage();
            stage.setTitle("Module Test - " + selectedWrapper.getModule().getModuleName());
            stage.setScene(new Scene(root));
            stage.getScene().getStylesheets().add(getClass().getResource("/css/style.css").toExternalForm());
            stage.setMaximized(true);
            
            // Refresh progress when window closes
            stage.setOnHidden(e -> {
                loadModulesWithProgress();
                calculateStatistics();
                updateCourseTestButton();
            });
            
            stage.show();

        } catch (Exception e) {
            e.printStackTrace();
            showError("Failed to start module test: " + e.getMessage());
        }
    }

    @FXML
    private void handleTakeCourseTest() {
        try {
            boolean canTakeTest = progressService.canAttemptCourseTest(currentUser.getId(), currentCourse.getId());
            
            if (!canTakeTest) {
                showError("Course test is not available. Complete all modules first.");
                return;
            }

            FXMLLoader loader = new FXMLLoader(getClass().getResource("/fxml/StudentCourseTest.fxml"));
            Parent root = loader.load();

            StudentCourseTestController controller = loader.getController();
            controller.setCurrentUser(currentUser);
            controller.setCourse(currentCourse);

            Stage stage = new Stage();
            stage.setTitle("Course Final Test - " + currentCourse.getCourseName());
            stage.setScene(new Scene(root));
            stage.getScene().getStylesheets().add(getClass().getResource("/css/style.css").toExternalForm());
            stage.setMaximized(true);
            
            // Refresh progress when window closes
            stage.setOnHidden(e -> {
                loadModulesWithProgress();
                calculateStatistics();
                updateCourseTestButton();
            });
            
            stage.show();

        } catch (Exception e) {
            e.printStackTrace();
            showError("Failed to start course test: " + e.getMessage());
        }
    }

    @FXML
    private void handleClose() {
        Stage stage = (Stage) closeButton.getScene().getWindow();
        stage.close();
    }

    @FXML
    private void handleShop() {
        try {
            FXMLLoader loader = new FXMLLoader(getClass().getResource("/fxml/CourseShop.fxml"));
            Parent root = loader.load();
            CourseShopController ctrl = loader.getController();
            ctrl.setup(currentUser, currentCourse);
            Stage stage = new Stage();
            stage.setTitle("Shop — " + currentCourse.getCourseName());
            stage.setScene(new Scene(root, 820, 580));
            stage.getScene().getStylesheets().add(getClass().getResource("/css/style.css").toExternalForm());
            stage.initOwner(closeButton.getScene().getWindow());
            stage.setResizable(true);
            stage.show();
        } catch (Exception e) {
            e.printStackTrace();
            showError("Failed to open shop: " + e.getMessage());
        }
    }

    private void showError(String message) {
        errorLabel.setText(message);
        errorLabel.setVisible(true);
    }

    // Wrapper class for displaying module with progress information
    public static class ModuleProgressWrapper {
        private final Module module;
        private final StudentProgress progress;
        private final boolean canAccess;
        private final boolean isFinalTest;
        private final StudentProgressService.CourseCompletionSummary courseProgress;
        private final Course course;

        // Constructor for regular modules
        public ModuleProgressWrapper(Module module, StudentProgress progress, boolean canAccess) {
            this.module = module;
            this.progress = progress;
            this.canAccess = canAccess;
            this.isFinalTest = false;
            this.courseProgress = null;
            this.course = null;
        }

        // Constructor for Final Test row
        public ModuleProgressWrapper(StudentProgressService.CourseCompletionSummary courseProgress, Course course) {
            this.module = null;
            this.progress = null;
            this.canAccess = courseProgress.isCanAttemptCourseTest();
            this.isFinalTest = true;
            this.courseProgress = courseProgress;
            this.course = course;
        }

        public Module getModule() { return module; }
        public StudentProgress getProgress() { return progress; }
        public boolean isCanAccess() { return canAccess; }
        public boolean isFinalTest() { return isFinalTest; }

        public String getModuleName() { 
            if (isFinalTest) return "Final Test";
            return module.getModuleName(); 
        }
        
        public Integer getModuleOrder() { 
            if (isFinalTest) return 999; // Show at bottom
            return module.getModuleOrder(); 
        }

        public String getStatusText() {
            if (isFinalTest) {
                if (courseProgress.isCourseTestCompleted()) {
                    return courseProgress.isCourseTestPassed() ? "Passed" : "Failed";
                } else if (courseProgress.isCanAttemptCourseTest()) {
                    return "Available";
                } else {
                    return "Locked";
                }
            }
            
            if (progress == null) return "Not Started";
            
            // Fix module status display - show "Completed" instead of status text for completed modules
            if ("MODULE_COMPLETED".equals(progress.getModuleStatus())) {
                return "Completed";
            }
            
            return progress.getStatusDisplayText();
        }

        public String getStatusColor() {
            if (isFinalTest) {
                if (courseProgress.isCourseTestCompleted()) {
                    return courseProgress.isCourseTestPassed() ? "#28a745" : "#dc3545"; // Green or Red
                } else if (courseProgress.isCanAttemptCourseTest()) {
                    return "#17a2b8"; // Blue
                } else {
                    return "#6c757d"; // Gray
                }
            }
            
            if (progress == null) return "#6c757d";
            
            // Use green for completed modules
            if ("MODULE_COMPLETED".equals(progress.getModuleStatus())) {
                return "#28a745"; // Green
            }
            
            return progress.getStatusColor();
        }

        public String getProgressText() {
            if (isFinalTest) {
                if (courseProgress.isCourseTestCompleted()) {
                    // Get actual scores from StudentCourseProgress
                    try {
                        StudentProgressService progressService = new StudentProgressService();
                        StudentCourseProgress actualProgress = progressService.getCourseProgress(
                            courseProgress.getStudentId(), courseProgress.getCourseId());
                        return String.format("%d/%d points", 
                            actualProgress.getCourseTestScore(), actualProgress.getCourseTestMaxScore());
                    } catch (Exception e) {
                        return "Score unavailable";
                    }
                } else {
                    return String.format("%d questions", course.getCourseTestQuestions());
                }
            }
            
            if (progress == null) return "0/0 tasks";
            return String.format("%d/%d tasks passed", progress.getTasksPassedCount(), progress.getMinTasksRequired());
        }

        public String getAccessText() {
            if (isFinalTest) {
                if (courseProgress.isCourseTestCompleted()) {
                    return "Completed";
                } else if (courseProgress.isCanAttemptCourseTest()) {
                    return "Available";
                } else {
                    return "Locked";
                }
            }
            
            if (!canAccess) return "Locked";
            if (progress != null && "MODULE_COMPLETED".equals(progress.getModuleStatus())) return "Completed";
            return "Available";
        }
    }
}