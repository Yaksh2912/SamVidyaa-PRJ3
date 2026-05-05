package com.samvidya.controller;

import com.samvidya.dao.CourseDAO;
import com.samvidya.model.Course;
import com.samvidya.model.User;
import com.samvidya.model.ImportResult;
import com.samvidya.service.CourseImportService;
import com.samvidya.service.CourseExportService;
import javafx.collections.FXCollections;
import javafx.collections.ObservableList;
import javafx.concurrent.Task;
import javafx.fxml.FXML;
import javafx.fxml.FXMLLoader;
import javafx.scene.Parent;
import javafx.scene.Scene;
import javafx.scene.control.*;
import javafx.scene.control.cell.PropertyValueFactory;
import javafx.scene.layout.HBox;
import javafx.stage.DirectoryChooser;
import javafx.stage.FileChooser;
import javafx.stage.Stage;
import javafx.stage.Modality;
import javafx.util.Callback;
import javafx.application.Platform;

import java.awt.Desktop;
import java.io.File;
import java.sql.SQLException;
import java.util.List;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

public class InstructorDashboardController {

    @FXML
    private Label welcomeLabel;

    @FXML
    private TableView<Course> coursesTable;

    @FXML
    private TableColumn<Course, String> courseCodeColumn;

    @FXML
    private TableColumn<Course, String> courseNameColumn;

    @FXML
    private TableColumn<Course, String> subjectColumn;

    @FXML
    private TableColumn<Course, Integer> courseTestColumn;

    @FXML
    private TableColumn<Course, Integer> moduleCountColumn;

    @FXML
    private TableColumn<Course, String> createdAtColumn;

    @FXML
    private TableColumn<Course, Void> actionsColumn;

    @FXML
    private Button createCourseButton;
    
    @FXML
    private Button importCourseButton;

    @FXML
    private Button editCourseButton;

    @FXML
    private Button viewStudentsButton;

    @FXML
    private Button analyticsButton;

    @FXML
    private Button usersButton; // Admin only

    @FXML
    private Button studentsButton; // Instructor only

    @FXML
    private Label courseCountLabel;

    @FXML
    private Label selectedCourseLabel;

    private User currentUser;
    private CourseDAO courseDAO;
    private CourseImportService courseImportService;
    private CourseExportService courseExportService;
    private ObservableList<Course> coursesList;
    private ExecutorService executorService;

    @FXML
    private void initialize() {
        courseDAO = new CourseDAO();
        courseImportService = new CourseImportService();
        courseExportService = new CourseExportService();
        coursesList = FXCollections.observableArrayList();
        executorService = Executors.newCachedThreadPool();

        // Setup table columns
        courseCodeColumn.setCellValueFactory(new PropertyValueFactory<>("courseCode"));
        courseNameColumn.setCellValueFactory(new PropertyValueFactory<>("courseName"));
        subjectColumn.setCellValueFactory(new PropertyValueFactory<>("subject"));
        courseTestColumn.setCellValueFactory(new PropertyValueFactory<>("courseTestQuestions"));
        
        // Module count column
        moduleCountColumn.setCellValueFactory(cellData -> {
            Course course = cellData.getValue();
            int moduleCount = course.getModules() != null ? course.getModules().size() : 0;
            return new javafx.beans.property.SimpleIntegerProperty(moduleCount).asObject();
        });
        
        // Created at column
        createdAtColumn.setCellValueFactory(cellData -> {
            Course course = cellData.getValue();
            if (course.getCreatedAt() != null) {
                String formattedDate = course.getCreatedAt().format(java.time.format.DateTimeFormatter.ofPattern("MMM dd, yyyy"));
                return new javafx.beans.property.SimpleStringProperty(formattedDate);
            }
            return new javafx.beans.property.SimpleStringProperty("N/A");
        });
        
        // Actions column
        actionsColumn.setCellFactory(createActionButtons());

        coursesTable.setItems(coursesList);

        // Setup table selection listener
        coursesTable.getSelectionModel().selectedItemProperty().addListener((obs, oldSelection, newSelection) -> {
            boolean hasSelection = newSelection != null;
            editCourseButton.setDisable(!hasSelection);
            viewStudentsButton.setDisable(!hasSelection);
            analyticsButton.setDisable(!hasSelection);
            
            // Update selected course label
            updateSelectedCourseLabel(newSelection);
        });

        // Setup context menu for table
        setupTableContextMenu();

        // Initially disable buttons
        editCourseButton.setDisable(true);
        viewStudentsButton.setDisable(true);
        analyticsButton.setDisable(true);
    }

    public void setCurrentUser(User user) {
        this.currentUser = user;
        
        // Set welcome message based on role
        if (user.getRole().equals("ADMIN")) {
            welcomeLabel.setText("Welcome, " + user.getFullName() + " (Administrator)");
            if (usersButton != null) usersButton.setVisible(true);
            if (studentsButton != null) studentsButton.setVisible(false);
        } else if (user.getRole().equals("INSTRUCTOR")) {
            welcomeLabel.setText("Welcome, " + user.getFullName());
            if (usersButton != null) usersButton.setVisible(false);
            if (studentsButton != null) studentsButton.setVisible(true);
        } else {
            welcomeLabel.setText("Welcome, " + user.getFullName());
            if (usersButton != null) usersButton.setVisible(false);
            if (studentsButton != null) studentsButton.setVisible(false);
        }
        
        loadCourses();
    }

    private void loadCourses() {
        try {
            List<Course> courses;
            if (currentUser.getRole().equals("ADMIN")) {
                // Admin can see all courses (active and inactive)
                courses = courseDAO.findAllCourses();
            } else {
                // Instructor can see their own courses (active and inactive)
                courses = courseDAO.findAllByInstructorId(currentUser.getId());
            }
            coursesList.clear();
            coursesList.addAll(courses);
            
            // Update course count label
            updateCourseCountLabel();
            
        } catch (Exception e) {
            e.printStackTrace();
            showAlert("Error", "Failed to load courses: " + e.getMessage());
        }
    }
    
    private void updateCourseCountLabel() {
        if (courseCountLabel != null) {
            int count = coursesList.size();
            String text = count + (count == 1 ? " course" : " courses");
            courseCountLabel.setText(text);
        }
    }
    
    private void updateSelectedCourseLabel(Course course) {
        if (selectedCourseLabel != null) {
            if (course != null) {
                selectedCourseLabel.setText("Selected: " + course.getCourseName());
                selectedCourseLabel.setStyle("-fx-font-size: 14px; -fx-text-fill: #2196F3; -fx-font-weight: bold;");
            } else {
                selectedCourseLabel.setText("No course selected");
                selectedCourseLabel.setStyle("-fx-font-size: 14px; -fx-text-fill: #666666; -fx-font-style: italic;");
            }
        }
    }
    
    private Callback<TableColumn<Course, Void>, TableCell<Course, Void>> createActionButtons() {
        return new Callback<TableColumn<Course, Void>, TableCell<Course, Void>>() {
            @Override
            public TableCell<Course, Void> call(TableColumn<Course, Void> param) {
                return new TableCell<Course, Void>() {
                    private final ToggleButton activeToggle = new ToggleButton();
                    private final Button viewButton = new Button("View");
                    private final Button exportButton = new Button("Export");
                    private final HBox buttons = new HBox(5);
                    
                    {
                        // Style the toggle button - same size as other buttons
                        activeToggle.setStyle("-fx-background-radius: 5; -fx-padding: 5 8; -fx-min-width: 60; -fx-font-size: 12px;");
                        viewButton.setStyle("-fx-background-radius: 5; -fx-padding: 5 8; -fx-min-width: 50; -fx-background-color: #2196F3; -fx-text-fill: white; -fx-font-size: 12px;");
                        exportButton.setStyle("-fx-background-radius: 5; -fx-padding: 5 8; -fx-min-width: 60; -fx-background-color: #8e44ad; -fx-text-fill: white; -fx-font-size: 12px;");
                        
                        activeToggle.setOnAction(e -> {
                            Course course = getTableView().getItems().get(getIndex());
                            handleToggleActive(course, activeToggle.isSelected());
                        });
                        
                        viewButton.setOnAction(e -> {
                            Course course = getTableView().getItems().get(getIndex());
                            handleViewCourse(course);
                        });
                        
                        exportButton.setOnAction(e -> {
                            Course course = getTableView().getItems().get(getIndex());
                            handleExportCourseFromTable(course);
                        });
                        
                        buttons.getChildren().addAll(activeToggle, viewButton, exportButton);
                    }
                    
                    @Override
                    protected void updateItem(Void item, boolean empty) {
                        super.updateItem(item, empty);
                        if (empty) {
                            setGraphic(null);
                        } else {
                            Course course = getTableView().getItems().get(getIndex());
                            if (course != null) {
                                // Update toggle button state and style
                                activeToggle.setSelected(course.isActive());
                                if (course.isActive()) {
                                    activeToggle.setText("Active");
                                    activeToggle.setStyle("-fx-background-radius: 5; -fx-padding: 5 8; -fx-min-width: 60; -fx-background-color: #4caf50; -fx-text-fill: white; -fx-font-size: 12px;");
                                } else {
                                    activeToggle.setText("Inactive");
                                    activeToggle.setStyle("-fx-background-radius: 5; -fx-padding: 5 8; -fx-min-width: 60; -fx-background-color: #f44336; -fx-text-fill: white; -fx-font-size: 12px;");
                                }
                                setGraphic(buttons);
                            } else {
                                setGraphic(null);
                            }
                        }
                    }
                };
            }
        };
    }
    
    private void handleToggleActive(Course course, boolean isActive) {
        executorService.submit(() -> {
            try {
                course.setActive(isActive);
                courseDAO.save(course);
                
                Platform.runLater(() -> {
                    // Refresh the table to show updated state
                    coursesTable.refresh();
                    showAlert("Success", "Course " + (isActive ? "activated" : "deactivated") + " successfully");
                });
            } catch (Exception e) {
                Platform.runLater(() -> {
                    // Revert the toggle state on error
                    course.setActive(!isActive);
                    coursesTable.refresh();
                    showAlert("Error", "Failed to update course status: " + e.getMessage());
                });
            }
        });
    }
    
    private void handleViewCourse(Course course) {
        // Same functionality as manage course
        handleEditCourse();
    }

    @FXML
    private void handleCreateCourse() {
        try {
            FXMLLoader loader = new FXMLLoader(getClass().getResource("/fxml/CreateCourse.fxml"));
            Parent root = loader.load();

            CreateCourseController controller = loader.getController();
            controller.setCurrentUser(currentUser);
            controller.setParentController(this);

            Stage stage = new Stage();
            stage.setTitle("Create New Course");
            stage.setScene(new Scene(root));
            stage.getScene().getStylesheets().add(getClass().getResource("/css/style.css").toExternalForm());
            stage.initOwner(createCourseButton.getScene().getWindow());
            stage.setResizable(false);
            stage.showAndWait();

        } catch (Exception e) {
            e.printStackTrace();
            showAlert("Error", "Failed to open create course dialog: " + e.getMessage());
        }
    }
    
    @FXML
    private void handleImportCourse() {
        FileChooser fileChooser = new FileChooser();
        fileChooser.setTitle("Select Course Export File");
        fileChooser.setInitialDirectory(new File(System.getProperty("user.home")));
        fileChooser.getExtensionFilters().add(
            new FileChooser.ExtensionFilter("Course Export Files", "*.zip")
        );
        
        File selectedFile = fileChooser.showOpenDialog(importCourseButton.getScene().getWindow());
        if (selectedFile == null) {
            return;
        }
        
        // Show progress dialog
        Alert progressAlert = new Alert(Alert.AlertType.INFORMATION);
        progressAlert.setTitle("Importing Course");
        progressAlert.setHeaderText("Please wait while the course is being imported...");
        progressAlert.setContentText("This may take a few moments.");
        progressAlert.getDialogPane().lookupButton(ButtonType.OK).setVisible(false);
        progressAlert.show();
        
        Task<ImportResult> importTask = new Task<ImportResult>() {
            @Override
            protected ImportResult call() throws Exception {
                return courseImportService.importCourse(selectedFile.getAbsolutePath(), 
                                                       currentUser);
            }
        };
        
        importTask.setOnSucceeded(event -> {
            progressAlert.close();
            ImportResult result = importTask.getValue();
            
            Alert alert = new Alert(Alert.AlertType.INFORMATION);
            alert.setTitle("Import Successful");
            alert.setHeaderText("Course imported successfully!");
            alert.setContentText(result.getSummary());
            alert.showAndWait();
            
            // Refresh courses table
            refreshCourses();
        });
        
        importTask.setOnFailed(event -> {
            progressAlert.close();
            Throwable exception = importTask.getException();
            
            Alert alert = new Alert(Alert.AlertType.ERROR);
            alert.setTitle("Import Failed");
            alert.setHeaderText("Failed to import course");
            alert.setContentText(exception.getMessage());
            alert.showAndWait();
            exception.printStackTrace();
        });
        
        new Thread(importTask).start();
    }
    
    private void handleExportCourseFromTable(Course course) {
        DirectoryChooser directoryChooser = new DirectoryChooser();
        directoryChooser.setTitle("Select Export Location");
        directoryChooser.setInitialDirectory(new File(System.getProperty("user.home")));
        
        File selectedDirectory = directoryChooser.showDialog(coursesTable.getScene().getWindow());
        if (selectedDirectory == null) {
            return;
        }
        
        // Show progress dialog
        Alert progressAlert = new Alert(Alert.AlertType.INFORMATION);
        progressAlert.setTitle("Exporting Course");
        progressAlert.setHeaderText("Please wait while the course is being exported...");
        progressAlert.setContentText("This may take a few moments.");
        progressAlert.getDialogPane().lookupButton(ButtonType.OK).setVisible(false);
        progressAlert.show();
        
        Task<String> exportTask = new Task<String>() {
            @Override
            protected String call() throws Exception {
                return courseExportService.exportCourse(course.getId(), 
                                                       selectedDirectory.getAbsolutePath());
            }
        };
        
        exportTask.setOnSucceeded(event -> {
            progressAlert.close();
            String exportPath = exportTask.getValue();
            
            Alert alert = new Alert(Alert.AlertType.INFORMATION);
            alert.setTitle("Export Successful");
            alert.setHeaderText("Course exported successfully!");
            alert.setContentText("Export file created at:\n" + exportPath);
            
            ButtonType openLocationButton = new ButtonType("Open Location");
            ButtonType okButton = new ButtonType("OK", ButtonBar.ButtonData.CANCEL_CLOSE);
            alert.getButtonTypes().setAll(openLocationButton, okButton);
            
            alert.showAndWait().ifPresent(response -> {
                if (response == openLocationButton) {
                    try {
                        Desktop.getDesktop().open(new File(exportPath).getParentFile());
                    } catch (Exception e) {
                        e.printStackTrace();
                    }
                }
            });
        });
        
        exportTask.setOnFailed(event -> {
            progressAlert.close();
            Throwable exception = exportTask.getException();
            
            Alert alert = new Alert(Alert.AlertType.ERROR);
            alert.setTitle("Export Failed");
            alert.setHeaderText("Failed to export course");
            alert.setContentText(exception.getMessage());
            alert.showAndWait();
            exception.printStackTrace();
        });
        
        new Thread(exportTask).start();
    }

    public void refreshCourses() {
        loadCourses();
    }

    @FXML
    private void handleEditCourse() {
        Course selectedCourse = coursesTable.getSelectionModel().getSelectedItem();
        if (selectedCourse == null) {
            showAlert("Warning", "Please select a course to edit");
            return;
        }

        try {
            FXMLLoader loader = new FXMLLoader(getClass().getResource("/fxml/CourseManagement.fxml"));
            Parent root = loader.load();

            CourseManagementController controller = loader.getController();
            controller.setCurrentUser(currentUser);
            controller.setParentController(this);
            controller.setCourse(selectedCourse);

            Stage stage = new Stage();
            stage.setTitle("Manage Course - " + selectedCourse.getCourseName());
            stage.setScene(new Scene(root));
            stage.getScene().getStylesheets().add(getClass().getResource("/css/style.css").toExternalForm());
            stage.initOwner(editCourseButton.getScene().getWindow());
            
            // Set stage to fit within screen bounds
            javafx.stage.Screen screen = javafx.stage.Screen.getPrimary();
            javafx.geometry.Rectangle2D bounds = screen.getVisualBounds();
            stage.setMaxWidth(bounds.getWidth() * 0.9);
            stage.setMaxHeight(bounds.getHeight() * 0.9);
            stage.setResizable(true);
            
            stage.show();

        } catch (Exception e) {
            e.printStackTrace();
            showAlert("Error", "Failed to open course management: " + e.getMessage());
        }
    }

    @FXML
    private void handleViewStudents() {
        Course selectedCourse = coursesTable.getSelectionModel().getSelectedItem();
        if (selectedCourse == null) {
            showAlert("Warning", "Please select a course to manage students");
            return;
        }

        try {
            FXMLLoader loader = new FXMLLoader(getClass().getResource("/fxml/student_access_management.fxml"));
            Parent root = loader.load();

            StudentAccessManagementController controller = loader.getController();
            controller.setCourse(selectedCourse);

            Stage stage = new Stage();
            stage.setTitle("Student Access Management - " + selectedCourse.getCourseName());
            stage.setScene(new Scene(root, 1000, 700));
            stage.getScene().getStylesheets().add(getClass().getResource("/css/style.css").toExternalForm());
            stage.initOwner(viewStudentsButton.getScene().getWindow());
            stage.setResizable(true);
            stage.show();

        } catch (Exception e) {
            e.printStackTrace();
            showAlert("Error", "Failed to open student management: " + e.getMessage());
        }
    }

    @FXML
    private void handleAnalytics() {
        Course selectedCourse = coursesTable.getSelectionModel().getSelectedItem();
        if (selectedCourse == null) {
            showAlert("Warning", "Please select a course to view analytics");
            return;
        }

        try {
            FXMLLoader loader = new FXMLLoader(getClass().getResource("/fxml/CourseAnalytics.fxml"));
            Parent root = loader.load();

            com.samvidya.controller.CourseAnalyticsController controller = loader.getController();
            controller.setCourse(selectedCourse);

            Stage stage = new Stage();
            stage.setTitle("Analytics — " + selectedCourse.getCourseName());
            stage.setScene(new javafx.scene.Scene(root, 900, 700));
            stage.getScene().getStylesheets().add(getClass().getResource("/css/style.css").toExternalForm());
            stage.initOwner(analyticsButton.getScene().getWindow());
            stage.setResizable(true);
            stage.show();
        } catch (Exception e) {
            e.printStackTrace();
            showAlert("Error", "Failed to open analytics view: " + e.getMessage());
        }
    }

    @FXML
    private void handleShop() {
        Course selectedCourse = coursesTable.getSelectionModel().getSelectedItem();
        if (selectedCourse == null) {
            showAlert("Warning", "Please select a course to manage its shop");
            return;
        }
        try {
            FXMLLoader loader = new FXMLLoader(getClass().getResource("/fxml/CourseShopManagement.fxml"));
            Parent root = loader.load();
            com.samvidya.controller.CourseShopManagementController ctrl = loader.getController();
            ctrl.setCourse(selectedCourse);
            Stage stage = new Stage();
            stage.setTitle("Shop — " + selectedCourse.getCourseName());
            stage.setScene(new javafx.scene.Scene(root, 860, 640));
            stage.getScene().getStylesheets().add(getClass().getResource("/css/style.css").toExternalForm());
            stage.initOwner(analyticsButton.getScene().getWindow());
            stage.setResizable(true);
            stage.show();
        } catch (Exception e) {
            e.printStackTrace();
            showAlert("Error", "Failed to open shop management: " + e.getMessage());
        }
    }

    @FXML
    private void handleUsers() {
        if (!currentUser.getRole().equals("ADMIN")) {
            showAlert("Access Denied", "Only administrators can manage users");
            return;
        }

        try {
            FXMLLoader loader = new FXMLLoader(getClass().getResource("/fxml/AdminUsersManagement.fxml"));
            Parent root = loader.load();

            Stage stage = new Stage();
            Scene scene = new Scene(root);
            scene.getStylesheets().add(getClass().getResource("/css/style.css").toExternalForm());
            stage.setScene(scene);
            stage.setTitle("SamVidya - User Management");
            
            // Set window size to 80% of screen
            javafx.stage.Screen screen = javafx.stage.Screen.getPrimary();
            double screenWidth = screen.getVisualBounds().getWidth();
            double screenHeight = screen.getVisualBounds().getHeight();
            stage.setWidth(screenWidth * 0.8);
            stage.setHeight(screenHeight * 0.8);
            
            stage.show();
            stage.centerOnScreen();
        } catch (Exception e) {
            e.printStackTrace();
            showAlert("Error", "Failed to open user management: " + e.getMessage());
        }
    }

    @FXML
    private void handleStudents() {
        if (!currentUser.getRole().equals("INSTRUCTOR")) {
            showAlert("Access Denied", "Only instructors can view students");
            return;
        }

        try {
            FXMLLoader loader = new FXMLLoader(getClass().getResource("/fxml/AdminUsersManagement.fxml"));
            Parent root = loader.load();
            
            // Get the controller and set it to student-only mode
            AdminUsersManagementController controller = loader.getController();
            controller.setStudentOnlyMode(true);

            Stage stage = new Stage();
            Scene scene = new Scene(root);
            scene.getStylesheets().add(getClass().getResource("/css/style.css").toExternalForm());
            stage.setScene(scene);
            stage.setTitle("SamVidya - Students");
            
            // Set window size to 80% of screen
            javafx.stage.Screen screen = javafx.stage.Screen.getPrimary();
            double screenWidth = screen.getVisualBounds().getWidth();
            double screenHeight = screen.getVisualBounds().getHeight();
            stage.setWidth(screenWidth * 0.8);
            stage.setHeight(screenHeight * 0.8);
            
            stage.show();
            stage.centerOnScreen();
        } catch (Exception e) {
            e.printStackTrace();
            showAlert("Error", "Failed to open students view: " + e.getMessage());
        }
    }

    @FXML
    private void handleRefresh() {
        loadCourses();
    }

    @FXML
    private void handleLogout() {
        try {
            FXMLLoader loader = new FXMLLoader(getClass().getResource("/fxml/RoleSelection.fxml"));
            Parent root = loader.load();

            Stage stage = (Stage) createCourseButton.getScene().getWindow();
            Scene scene = new Scene(root);
            scene.getStylesheets().add(getClass().getResource("/css/style.css").toExternalForm());
            
            stage.setTitle("SamVidya - Role Selection");
            stage.setScene(scene);
            stage.centerOnScreen();
        } catch (Exception e) {
            e.printStackTrace();
            showAlert("Error", "Failed to logout: " + e.getMessage());
        }
    }

    private void showAlert(String title, String message) {
        Alert alert = new Alert(Alert.AlertType.INFORMATION);
        alert.setTitle(title);
        alert.setHeaderText(null);
        alert.setContentText(message);
        alert.showAndWait();
    }

    private void setupTableContextMenu() {
        ContextMenu contextMenu = new ContextMenu();
        
        MenuItem overviewItem = new MenuItem("Course Overview");
        overviewItem.setOnAction(e -> handleCourseOverview());
        
        MenuItem editQuickItem = new MenuItem("Quick Edit");
        editQuickItem.setOnAction(e -> handleQuickEditCourse());
        
        MenuItem manageItem = new MenuItem("Manage Course & Modules");
        manageItem.setOnAction(e -> handleEditCourse());
        
        MenuItem viewStudentsItem = new MenuItem("View Students");
        viewStudentsItem.setOnAction(e -> handleViewStudents());
        
        MenuItem analyticsItem = new MenuItem("View Analytics");
        analyticsItem.setOnAction(e -> handleAnalytics());
        
        contextMenu.getItems().addAll(overviewItem, new SeparatorMenuItem(),
                                     editQuickItem, manageItem, new SeparatorMenuItem(), 
                                     viewStudentsItem, analyticsItem);
        
        coursesTable.setContextMenu(contextMenu);
    }

    private void handleQuickEditCourse() {
        Course selectedCourse = coursesTable.getSelectionModel().getSelectedItem();
        if (selectedCourse == null) {
            showAlert("Warning", "Please select a course to edit");
            return;
        }

        try {
            FXMLLoader loader = new FXMLLoader(getClass().getResource("/fxml/EditCourse.fxml"));
            Parent root = loader.load();

            EditCourseController controller = loader.getController();
            controller.setCurrentUser(currentUser);
            controller.setParentController(this);
            controller.setCourse(selectedCourse);

            Stage stage = new Stage();
            stage.setTitle("Edit Course - " + selectedCourse.getCourseName());
            stage.setScene(new Scene(root));
            stage.getScene().getStylesheets().add(getClass().getResource("/css/style.css").toExternalForm());
            stage.initOwner(editCourseButton.getScene().getWindow());
            stage.setResizable(false);
            stage.showAndWait();

        } catch (Exception e) {
            e.printStackTrace();
            showAlert("Error", "Failed to open edit course dialog: " + e.getMessage());
        }
    }

    private void handleCourseOverview() {
        Course selectedCourse = coursesTable.getSelectionModel().getSelectedItem();
        if (selectedCourse == null) {
            showAlert("Warning", "Please select a course to view overview");
            return;
        }

        try {
            FXMLLoader loader = new FXMLLoader(getClass().getResource("/fxml/CourseOverview.fxml"));
            Parent root = loader.load();

            CourseOverviewController controller = loader.getController();
            controller.setCurrentUser(currentUser);
            controller.setCourse(selectedCourse);

            Stage stage = new Stage();
            stage.setTitle("Course Overview - " + selectedCourse.getCourseName());
            stage.setScene(new Scene(root));
            stage.getScene().getStylesheets().add(getClass().getResource("/css/style.css").toExternalForm());
            stage.initOwner(editCourseButton.getScene().getWindow());
            stage.setResizable(false);
            stage.showAndWait();

        } catch (Exception e) {
            e.printStackTrace();
            showAlert("Error", "Failed to open course overview: " + e.getMessage());
        }
    }
}