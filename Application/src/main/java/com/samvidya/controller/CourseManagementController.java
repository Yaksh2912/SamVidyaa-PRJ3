package com.samvidya.controller;

import com.samvidya.dao.CourseDAO;
import com.samvidya.dao.ModuleDAO;
import com.samvidya.dao.CodingQuestionDAO;
import com.samvidya.dao.TaskDAO;
import com.samvidya.model.Course;
import com.samvidya.model.Module;
import com.samvidya.model.CodingQuestion;
import com.samvidya.model.Task;
import com.samvidya.model.User;
import com.samvidya.model.ImportResult;
import com.samvidya.service.CourseExportService;
import com.samvidya.service.ModuleExportService;
import com.samvidya.service.ModuleImportService;
import javafx.collections.FXCollections;
import javafx.collections.ObservableList;
import javafx.fxml.FXML;
import javafx.fxml.FXMLLoader;
import javafx.scene.Parent;
import javafx.scene.Scene;
import javafx.scene.control.*;
import javafx.scene.control.cell.PropertyValueFactory;
import javafx.scene.layout.HBox;
import javafx.stage.DirectoryChooser;
import javafx.stage.FileChooser;
import javafx.stage.Modality;
import javafx.stage.Stage;
import javafx.util.Callback;

import java.awt.Desktop;
import java.io.File;
import java.io.IOException;
import java.util.List;
import java.util.Optional;

public class CourseManagementController {

    @FXML
    private Label courseInfoLabel;

    @FXML
    private TextField courseCodeField;

    @FXML
    private TextField courseNameField;

    @FXML
    private TextArea descriptionArea;

    @FXML
    private ComboBox<String> subjectComboBox;

    @FXML
    private Spinner<Integer> courseTestQuestionsSpinner;

    @FXML
    private CheckBox activeCheckBox;

    @FXML
    private Button saveCourseButton;

    @FXML
    private TableView<Module> modulesTable;

    @FXML
    private TableColumn<Module, String> moduleNameColumn;

    @FXML
    private TableColumn<Module, Integer> moduleOrderColumn;

    @FXML
    private TableColumn<Module, Integer> tasksPerModuleColumn;

    @FXML
    private TableColumn<Module, Integer> testQuestionsColumn;

    @FXML
    private TableColumn<Module, Integer> totalTasksColumn;

    @FXML
    private TableColumn<Module, Integer> totalTestQuestionsColumn;
    
    @FXML
    private TableColumn<Module, Void> moduleActionsColumn;

    @FXML
    private Button addModuleButton;

    @FXML
    private Button editModuleButton;

    @FXML
    private Button deleteModuleButton;

    @FXML
    private Button manageTasksButton;

    @FXML
    private Button manageTestsButton;

    @FXML
    private Button manageStudentsButton;
    
    @FXML
    private Button exportCourseButton;
    
    @FXML
    private Button exportModuleButton;
    
    @FXML
    private Button importModuleButton;

    @FXML
    private TableView<CodingQuestion> courseTestsTable;

    @FXML
    private TableColumn<CodingQuestion, String> testQuestionTextColumn;

    @FXML
    private TableColumn<CodingQuestion, Integer> testPointsColumn;

    @FXML
    private TableColumn<CodingQuestion, String> testLanguageColumn;

    @FXML
    private TableColumn<CodingQuestion, String> testDifficultyColumn;

    @FXML
    private TableColumn<CodingQuestion, Integer> testTimeLimitColumn;

    @FXML
    private TableColumn<CodingQuestion, Integer> testCasesCountColumn;

    @FXML
    private Button addCourseTestButton;

    @FXML
    private Button editCourseTestButton;

    @FXML
    private Button deleteCourseTestButton;

    @FXML
    private Button closeButton;

    @FXML
    private Label errorLabel;
    
    // All Tasks Table
    @FXML
    private TableView<TaskWithModule> allTasksTable;
    @FXML
    private TableColumn<TaskWithModule, String> taskModuleColumn;
    @FXML
    private TableColumn<TaskWithModule, String> taskNameColumn;
    @FXML
    private TableColumn<TaskWithModule, String> taskDifficultyColumn;
    @FXML
    private TableColumn<TaskWithModule, Integer> taskPointsColumn;
    @FXML
    private TableColumn<TaskWithModule, String> taskLanguageColumn;
    @FXML
    private TableColumn<TaskWithModule, Integer> taskTimeLimitColumn;
    @FXML
    private TableColumn<TaskWithModule, Void> taskActionsColumn;
    
    // All Questions Table
    @FXML
    private TableView<QuestionWithModule> allQuestionsTable;
    @FXML
    private TableColumn<QuestionWithModule, String> questionModuleColumn;
    @FXML
    private TableColumn<QuestionWithModule, String> questionTextColumn;
    @FXML
    private TableColumn<QuestionWithModule, String> questionDifficultyColumn;
    @FXML
    private TableColumn<QuestionWithModule, Integer> questionPointsColumn;
    @FXML
    private TableColumn<QuestionWithModule, String> questionLanguageColumn;
    @FXML
    private TableColumn<QuestionWithModule, Integer> questionTimeLimitColumn;
    @FXML
    private TableColumn<QuestionWithModule, Void> questionActionsColumn;

    private User currentUser;
    private Course currentCourse;
    private CourseDAO courseDAO;
    private ModuleDAO moduleDAO;
    private CodingQuestionDAO codingQuestionDAO;
    private TaskDAO taskDAO;
    private CourseExportService courseExportService;
    private ModuleExportService moduleExportService;
    private ModuleImportService moduleImportService;
    private ObservableList<Module> modulesList;
    private ObservableList<CodingQuestion> courseTestsList;
    private ObservableList<TaskWithModule> allTasksList;
    private ObservableList<QuestionWithModule> allQuestionsList;
    private InstructorDashboardController parentController;

    @FXML
    private void initialize() {
        courseDAO = new CourseDAO();
        moduleDAO = new ModuleDAO();
        codingQuestionDAO = new CodingQuestionDAO();
        taskDAO = new TaskDAO();
        courseExportService = new CourseExportService();
        moduleExportService = new ModuleExportService();
        moduleImportService = new ModuleImportService();
        modulesList = FXCollections.observableArrayList();
        courseTestsList = FXCollections.observableArrayList();
        allTasksList = FXCollections.observableArrayList();
        allQuestionsList = FXCollections.observableArrayList();
        errorLabel.setVisible(false);

        // Setup subject options
        subjectComboBox.getItems().addAll("Python", "Java", "C++", "DSA", "JavaScript", "C", "Other");

        // Setup spinner
        courseTestQuestionsSpinner.setValueFactory(new SpinnerValueFactory.IntegerSpinnerValueFactory(1, 30, 5));

        // Setup modules table
        moduleNameColumn.setCellValueFactory(new PropertyValueFactory<>("moduleName"));
        moduleOrderColumn.setCellValueFactory(new PropertyValueFactory<>("moduleOrder"));
        tasksPerModuleColumn.setCellValueFactory(new PropertyValueFactory<>("tasksPerModule"));
        testQuestionsColumn.setCellValueFactory(new PropertyValueFactory<>("moduleTestQuestions"));
        totalTasksColumn.setCellValueFactory(new PropertyValueFactory<>("totalTasks"));
        totalTestQuestionsColumn.setCellValueFactory(new PropertyValueFactory<>("totalTestQuestions"));
        moduleActionsColumn.setCellFactory(createModuleActionButtons());

        modulesTable.setItems(modulesList);

        // Setup course tests table
        testQuestionTextColumn.setCellValueFactory(cellData -> {
            String questionText = cellData.getValue().getQuestionText();
            // Truncate long question text for display
            if (questionText != null && questionText.length() > 50) {
                questionText = questionText.substring(0, 47) + "...";
            }
            return new javafx.beans.property.SimpleStringProperty(questionText);
        });
        testPointsColumn.setCellValueFactory(new PropertyValueFactory<>("points"));
        testLanguageColumn.setCellValueFactory(new PropertyValueFactory<>("language"));
        testDifficultyColumn.setCellValueFactory(new PropertyValueFactory<>("difficulty"));
        testTimeLimitColumn.setCellValueFactory(new PropertyValueFactory<>("timeLimit"));
        testCasesCountColumn.setCellValueFactory(new PropertyValueFactory<>("testCasesCount"));

        courseTestsTable.setItems(courseTestsList);
        
        // Setup all tasks table
        taskModuleColumn.setCellValueFactory(new PropertyValueFactory<>("moduleName"));
        taskNameColumn.setCellValueFactory(cellData -> 
            new javafx.beans.property.SimpleStringProperty(cellData.getValue().getTask().getTaskName()));
        taskDifficultyColumn.setCellValueFactory(cellData -> 
            new javafx.beans.property.SimpleStringProperty(cellData.getValue().getTask().getDifficulty()));
        taskPointsColumn.setCellValueFactory(cellData -> 
            new javafx.beans.property.SimpleIntegerProperty(cellData.getValue().getTask().getPoints()).asObject());
        taskLanguageColumn.setCellValueFactory(cellData -> 
            new javafx.beans.property.SimpleStringProperty(cellData.getValue().getTask().getLanguage()));
        taskTimeLimitColumn.setCellValueFactory(cellData -> 
            new javafx.beans.property.SimpleIntegerProperty(cellData.getValue().getTask().getTimeLimit()).asObject());
        taskActionsColumn.setCellFactory(createTaskActionButtons());
        
        allTasksTable.setItems(allTasksList);
        
        // Setup all questions table
        questionModuleColumn.setCellValueFactory(new PropertyValueFactory<>("moduleName"));
        questionTextColumn.setCellValueFactory(cellData -> {
            String questionText = cellData.getValue().getQuestion().getQuestionText();
            if (questionText != null && questionText.length() > 50) {
                questionText = questionText.substring(0, 47) + "...";
            }
            return new javafx.beans.property.SimpleStringProperty(questionText);
        });
        questionDifficultyColumn.setCellValueFactory(cellData -> 
            new javafx.beans.property.SimpleStringProperty(cellData.getValue().getQuestion().getDifficulty()));
        questionPointsColumn.setCellValueFactory(cellData -> 
            new javafx.beans.property.SimpleIntegerProperty(cellData.getValue().getQuestion().getPoints()).asObject());
        questionLanguageColumn.setCellValueFactory(cellData -> 
            new javafx.beans.property.SimpleStringProperty(cellData.getValue().getQuestion().getLanguage()));
        questionTimeLimitColumn.setCellValueFactory(cellData -> 
            new javafx.beans.property.SimpleIntegerProperty(cellData.getValue().getQuestion().getTimeLimit()).asObject());
        questionActionsColumn.setCellFactory(createQuestionActionButtons());
        
        allQuestionsTable.setItems(allQuestionsList);

        // Setup table selection listeners
        modulesTable.getSelectionModel().selectedItemProperty().addListener((obs, oldSelection, newSelection) -> {
            boolean hasSelection = newSelection != null;
            editModuleButton.setDisable(!hasSelection);
            deleteModuleButton.setDisable(!hasSelection);
            manageTasksButton.setDisable(!hasSelection);
            manageTestsButton.setDisable(!hasSelection);
            exportModuleButton.setDisable(!hasSelection);
        });

        courseTestsTable.getSelectionModel().selectedItemProperty().addListener((obs, oldSelection, newSelection) -> {
            boolean hasSelection = newSelection != null;
            editCourseTestButton.setDisable(!hasSelection);
            deleteCourseTestButton.setDisable(!hasSelection);
        });

        // Setup double-click to manage tasks
        modulesTable.setRowFactory(tv -> {
            TableRow<Module> row = new TableRow<>();
            row.setOnMouseClicked(event -> {
                if (event.getClickCount() == 2 && !row.isEmpty()) {
                    handleManageTasks(row.getItem());
                }
            });
            return row;
        });

        // Setup double-click to edit course test
        courseTestsTable.setRowFactory(tv -> {
            TableRow<CodingQuestion> row = new TableRow<>();
            row.setOnMouseClicked(event -> {
                if (event.getClickCount() == 2 && !row.isEmpty()) {
                    handleEditCourseTest();
                }
            });
            return row;
        });

        // Initially disable buttons
        editModuleButton.setDisable(true);
        deleteModuleButton.setDisable(true);
        manageTasksButton.setDisable(true);
        manageTestsButton.setDisable(true);
        exportModuleButton.setDisable(true);
        editCourseTestButton.setDisable(true);
        deleteCourseTestButton.setDisable(true);
    }

    public void setCurrentUser(User user) {
        this.currentUser = user;
    }

    public void setParentController(InstructorDashboardController parentController) {
        this.parentController = parentController;
    }

    public void setCourse(Course course) {
        this.currentCourse = course;
        populateCourseFields();
        loadModules();
        loadCourseTests();
        loadAllTasks();
        loadAllQuestions();
    }

    private void populateCourseFields() {
        if (currentCourse != null) {
            courseInfoLabel.setText("Manage Course: " + currentCourse.getCourseName());
            courseCodeField.setText(currentCourse.getCourseCode());
            courseNameField.setText(currentCourse.getCourseName());
            descriptionArea.setText(currentCourse.getDescription());
            subjectComboBox.setValue(currentCourse.getSubject());
            courseTestQuestionsSpinner.getValueFactory().setValue(currentCourse.getCourseTestQuestions());
            activeCheckBox.setSelected(currentCourse.isActive());
        }
    }

    private void loadModules() {
        try {
            List<Module> modules = moduleDAO.findByCourseId(currentCourse.getId());
            modulesList.clear();
            modulesList.addAll(modules);
        } catch (Exception e) {
            e.printStackTrace();
            showError("Failed to load modules: " + e.getMessage());
        }
    }

    @FXML
    private void handleSaveCourse() {
        if (!validateCourseInput()) {
            return;
        }

        try {
            // Check if course code already exists (excluding current course)
            Course existingCourse = courseDAO.findByCourseCode(courseCodeField.getText().trim());
            if (existingCourse != null && !existingCourse.getId().equals(currentCourse.getId())) {
                showError("Course code already exists. Please choose a different code.");
                return;
            }

            // Update course details
            currentCourse.setCourseCode(courseCodeField.getText().trim().toUpperCase());
            currentCourse.setCourseName(courseNameField.getText().trim());
            currentCourse.setDescription(descriptionArea.getText().trim());
            currentCourse.setSubject(subjectComboBox.getValue());
            currentCourse.setCourseTestQuestions(courseTestQuestionsSpinner.getValue());
            currentCourse.setActive(activeCheckBox.isSelected());

            // Save to database
            courseDAO.save(currentCourse);

            // Show success message
            Alert alert = new Alert(Alert.AlertType.INFORMATION);
            alert.setTitle("Success");
            alert.setHeaderText(null);
            alert.setContentText("Course updated successfully!");
            alert.showAndWait();

            // Refresh parent controller
            if (parentController != null) {
                parentController.refreshCourses();
            }

        } catch (Exception e) {
            e.printStackTrace();
            showError("Failed to update course: " + e.getMessage());
        }
    }

    @FXML
    private void handleAddModule() {
        try {
            FXMLLoader loader = new FXMLLoader(getClass().getResource("/fxml/ModuleDialog.fxml"));
            Parent root = loader.load();

            ModuleDialogController controller = loader.getController();
            controller.setCourse(currentCourse);
            controller.setParentController(this);

            Stage stage = new Stage();
            stage.setTitle("Add New Module");
            stage.setScene(new Scene(root));
            stage.getScene().getStylesheets().add(getClass().getResource("/css/style.css").toExternalForm());
            stage.initModality(Modality.WINDOW_MODAL);
            stage.initOwner(addModuleButton.getScene().getWindow());
            stage.setResizable(false);
            stage.showAndWait();

        } catch (Exception e) {
            e.printStackTrace();
            showError("Failed to open add module dialog: " + e.getMessage());
        }
    }

    @FXML
    private void handleEditModule() {
        Module selectedModule = modulesTable.getSelectionModel().getSelectedItem();
        if (selectedModule == null) {
            showError("Please select a module to edit");
            return;
        }

        try {
            FXMLLoader loader = new FXMLLoader(getClass().getResource("/fxml/ModuleDialog.fxml"));
            Parent root = loader.load();

            ModuleDialogController controller = loader.getController();
            controller.setCourse(currentCourse);
            controller.setModule(selectedModule);
            controller.setParentController(this);

            Stage stage = new Stage();
            stage.setTitle("Edit Module");
            stage.setScene(new Scene(root));
            stage.getScene().getStylesheets().add(getClass().getResource("/css/style.css").toExternalForm());
            stage.initModality(Modality.WINDOW_MODAL);
            stage.initOwner(editModuleButton.getScene().getWindow());
            stage.setResizable(false);
            stage.showAndWait();

        } catch (Exception e) {
            e.printStackTrace();
            showError("Failed to open edit module dialog: " + e.getMessage());
        }
    }

    @FXML
    private void handleDeleteModule() {
        Module selectedModule = modulesTable.getSelectionModel().getSelectedItem();
        if (selectedModule == null) {
            showError("Please select a module to delete");
            return;
        }

        Alert confirmAlert = new Alert(Alert.AlertType.CONFIRMATION);
        confirmAlert.setTitle("Confirm Delete");
        confirmAlert.setHeaderText("Delete Module");
        confirmAlert.setContentText("Are you sure you want to delete the module '" + selectedModule.getModuleName() + "'?\n\nThis will also delete all tasks and test questions associated with this module.");

        Optional<ButtonType> result = confirmAlert.showAndWait();
        if (result.isPresent() && result.get() == ButtonType.OK) {
            try {
                moduleDAO.delete(selectedModule.getId());
                loadModules(); // Refresh the table
                
                Alert successAlert = new Alert(Alert.AlertType.INFORMATION);
                successAlert.setTitle("Success");
                successAlert.setHeaderText(null);
                successAlert.setContentText("Module deleted successfully!");
                successAlert.showAndWait();

            } catch (Exception e) {
                e.printStackTrace();
                showError("Failed to delete module: " + e.getMessage());
            }
        }
    }

    @FXML
    private void handleClose() {
        Stage stage = (Stage) closeButton.getScene().getWindow();
        stage.close();
    }

    @FXML
    private void handleManageTasks() {
        Module selectedModule = modulesTable.getSelectionModel().getSelectedItem();
        if (selectedModule == null) {
            showError("Please select a module to manage tasks");
            return;
        }
        handleManageTasks(selectedModule);
    }

    private void handleManageTasks(Module module) {
        try {
            FXMLLoader loader = new FXMLLoader(getClass().getResource("/fxml/TaskManagement.fxml"));
            Parent root = loader.load();

            TaskManagementController controller = loader.getController();
            controller.setModule(module);
            controller.setParentController(this);

            Stage stage = new Stage();
            stage.setTitle("Manage Tasks - " + module.getModuleName());
            stage.setScene(new Scene(root));
            stage.getScene().getStylesheets().add(getClass().getResource("/css/style.css").toExternalForm());
            stage.initModality(Modality.WINDOW_MODAL);
            stage.initOwner(manageTasksButton.getScene().getWindow());
            stage.show();

        } catch (Exception e) {
            e.printStackTrace();
            showError("Failed to open task management: " + e.getMessage());
        }
    }

    @FXML
    private void handleManageTests() {
        Module selectedModule = modulesTable.getSelectionModel().getSelectedItem();
        if (selectedModule == null) {
            showError("Please select a module to manage tests");
            return;
        }
        handleManageTests(selectedModule);
    }

    private void handleManageTests(Module module) {
        try {
            FXMLLoader loader = new FXMLLoader(getClass().getResource("/fxml/TestManagement.fxml"));
            Parent root = loader.load();

            TestManagementController controller = loader.getController();
            controller.setModule(module);
            controller.setCourse(currentCourse);
            controller.setParentController(this);

            Stage stage = new Stage();
            stage.setTitle("Manage Tests - " + module.getModuleName());
            stage.setScene(new Scene(root));
            stage.getScene().getStylesheets().add(getClass().getResource("/css/style.css").toExternalForm());
            stage.initModality(Modality.WINDOW_MODAL);
            stage.initOwner(manageTestsButton.getScene().getWindow());
            stage.show();

        } catch (Exception e) {
            e.printStackTrace();
            showError("Failed to open test management: " + e.getMessage());
        }
    }

    private void loadCourseTests() {
        try {
            List<CodingQuestion> courseTests = codingQuestionDAO.findCourseTests(currentCourse.getId());
            courseTestsList.clear();
            courseTestsList.addAll(courseTests);
        } catch (Exception e) {
            e.printStackTrace();
            showError("Failed to load course tests: " + e.getMessage());
        }
    }

    public void refreshModules() {
        loadModules();
        loadAllTasks();
        loadAllQuestions();
    }

    public void refreshCourseTests() {
        loadCourseTests();
    }

    private boolean validateCourseInput() {
        StringBuilder errors = new StringBuilder();

        if (courseCodeField.getText().trim().isEmpty()) {
            errors.append("Course code is required.\n");
        }

        if (courseNameField.getText().trim().isEmpty()) {
            errors.append("Course name is required.\n");
        }

        if (subjectComboBox.getValue() == null) {
            errors.append("Subject is required.\n");
        }

        if (courseTestQuestionsSpinner.getValue() < 1) {
            errors.append("Course test questions must be at least 1.\n");
        }

        if (errors.length() > 0) {
            showError(errors.toString());
            return false;
        }

        return true;
    }

    private void showError(String message) {
        errorLabel.setText(message);
        errorLabel.setVisible(true);
    }

    @FXML
    private void handleManageStudents() {
        openStudentAccessManagementDialog();
    }

    private void openStudentAccessManagementDialog() {
        try {
            FXMLLoader loader = new FXMLLoader(getClass().getResource("/fxml/student_access_management.fxml"));
            Parent root = loader.load();

            StudentAccessManagementController controller = loader.getController();
            controller.setCourse(currentCourse);

            Stage stage = new Stage();
            stage.setTitle("Student Access Management - " + currentCourse.getCourseName());
            stage.setScene(new Scene(root, 1000, 700));
            stage.getScene().getStylesheets().add(getClass().getResource("/css/style.css").toExternalForm());
            stage.initModality(Modality.WINDOW_MODAL);
            stage.initOwner(manageStudentsButton.getScene().getWindow());
            stage.setResizable(true);
            stage.showAndWait();

        } catch (Exception e) {
            e.printStackTrace();
            showError("Failed to open student access management: " + e.getMessage());
        }
    }

    @FXML
    private void handleAddCourseTest() {
        try {
            FXMLLoader loader = new FXMLLoader(getClass().getResource("/fxml/CodingQuestionDialog.fxml"));
            Parent root = loader.load();

            CodingQuestionDialogController controller = loader.getController();
            controller.setCourse(currentCourse);
            controller.setQuestionType("COURSE_TEST");
            controller.setParentController(this);

            Stage stage = new Stage();
            stage.setTitle("Add Course Test Question");
            stage.setScene(new Scene(root));
            stage.getScene().getStylesheets().add(getClass().getResource("/css/style.css").toExternalForm());
            stage.initModality(Modality.WINDOW_MODAL);
            stage.initOwner(addCourseTestButton.getScene().getWindow());
            stage.setResizable(true);
            stage.showAndWait();

        } catch (Exception e) {
            e.printStackTrace();
            showError("Failed to open add course test dialog: " + e.getMessage());
        }
    }

    @FXML
    private void handleEditCourseTest() {
        CodingQuestion selectedTest = courseTestsTable.getSelectionModel().getSelectedItem();
        if (selectedTest == null) {
            showError("Please select a course test to edit");
            return;
        }

        try {
            FXMLLoader loader = new FXMLLoader(getClass().getResource("/fxml/CodingQuestionDialog.fxml"));
            Parent root = loader.load();

            CodingQuestionDialogController controller = loader.getController();
            controller.setCourse(currentCourse);
            controller.setQuestionType("COURSE_TEST");
            controller.setCodingQuestion(selectedTest);
            controller.setParentController(this);

            Stage stage = new Stage();
            stage.setTitle("Edit Course Test Question");
            stage.setScene(new Scene(root));
            stage.getScene().getStylesheets().add(getClass().getResource("/css/style.css").toExternalForm());
            stage.initModality(Modality.WINDOW_MODAL);
            stage.initOwner(editCourseTestButton.getScene().getWindow());
            stage.setResizable(true);
            stage.showAndWait();

        } catch (Exception e) {
            e.printStackTrace();
            showError("Failed to open edit course test dialog: " + e.getMessage());
        }
    }

    @FXML
    private void handleDeleteCourseTest() {
        CodingQuestion selectedTest = courseTestsTable.getSelectionModel().getSelectedItem();
        if (selectedTest == null) {
            showError("Please select a course test to delete");
            return;
        }

        Alert confirmAlert = new Alert(Alert.AlertType.CONFIRMATION);
        confirmAlert.setTitle("Confirm Delete");
        confirmAlert.setHeaderText("Delete Course Test Question");
        confirmAlert.setContentText("Are you sure you want to delete this course test question?\n\n" +
                "Question: " + (selectedTest.getQuestionText().length() > 50 ? 
                selectedTest.getQuestionText().substring(0, 47) + "..." : selectedTest.getQuestionText()) +
                "\n\nThis action cannot be undone.");

        Optional<ButtonType> result = confirmAlert.showAndWait();
        if (result.isPresent() && result.get() == ButtonType.OK) {
            try {
                codingQuestionDAO.delete(selectedTest.getId());
                loadCourseTests(); // Refresh the table
                
                Alert successAlert = new Alert(Alert.AlertType.INFORMATION);
                successAlert.setTitle("Success");
                successAlert.setHeaderText(null);
                successAlert.setContentText("Course test question deleted successfully!");
                successAlert.showAndWait();

            } catch (Exception e) {
                e.printStackTrace();
                showError("Failed to delete course test question: " + e.getMessage());
            }
        }
    }
    
    @FXML
    private void handleExportCourse() {
        if (currentCourse == null) {
            showError("No course selected for export");
            return;
        }
        
        DirectoryChooser directoryChooser = new DirectoryChooser();
        directoryChooser.setTitle("Select Export Location");
        directoryChooser.setInitialDirectory(new File(System.getProperty("user.home")));
        
        File selectedDirectory = directoryChooser.showDialog(exportCourseButton.getScene().getWindow());
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
        
        javafx.concurrent.Task<String> exportTask = new javafx.concurrent.Task<String>() {
            @Override
            protected String call() throws Exception {
                return courseExportService.exportCourse(currentCourse.getId(), 
                                                       selectedDirectory.getAbsolutePath());
            }
        };
        
        exportTask.setOnSucceeded(event -> {
            progressAlert.close();
            String exportPath = exportTask.getValue();
            
            Alert alert = new Alert(Alert.AlertType.INFORMATION);
            alert.setTitle("Export Successful");
            alert.setHeaderText("Course exported successfully!");
            alert.setContentText("Export saved to:\n" + exportPath + 
                               "\n\nWould you like to open the location?");
            
            ButtonType openButton = new ButtonType("Open Location");
            ButtonType closeButton = new ButtonType("Close", ButtonBar.ButtonData.CANCEL_CLOSE);
            alert.getButtonTypes().setAll(openButton, closeButton);
            
            Optional<ButtonType> result = alert.showAndWait();
            if (result.isPresent() && result.get() == openButton) {
                try {
                    Desktop.getDesktop().open(selectedDirectory);
                } catch (IOException e) {
                    e.printStackTrace();
                }
            }
        });
        
        exportTask.setOnFailed(event -> {
            progressAlert.close();
            Throwable exception = exportTask.getException();
            showError("Export failed: " + exception.getMessage());
            exception.printStackTrace();
        });
        
        new Thread(exportTask).start();
    }
    
    @FXML
    private void handleExportModule() {
        Module selectedModule = modulesTable.getSelectionModel().getSelectedItem();
        if (selectedModule == null) {
            showError("Please select a module to export");
            return;
        }
        
        DirectoryChooser directoryChooser = new DirectoryChooser();
        directoryChooser.setTitle("Select Export Location");
        directoryChooser.setInitialDirectory(new File(System.getProperty("user.home")));
        
        File selectedDirectory = directoryChooser.showDialog(exportModuleButton.getScene().getWindow());
        if (selectedDirectory == null) {
            return;
        }
        
        // Show progress dialog
        Alert progressAlert = new Alert(Alert.AlertType.INFORMATION);
        progressAlert.setTitle("Exporting Module");
        progressAlert.setHeaderText("Please wait while the module is being exported...");
        progressAlert.setContentText("This may take a few moments.");
        progressAlert.getDialogPane().lookupButton(ButtonType.OK).setVisible(false);
        progressAlert.show();
        
        javafx.concurrent.Task<String> exportTask = new javafx.concurrent.Task<String>() {
            @Override
            protected String call() throws Exception {
                return moduleExportService.exportModule(selectedModule.getId(), 
                                                       selectedDirectory.getAbsolutePath());
            }
        };
        
        exportTask.setOnSucceeded(event -> {
            progressAlert.close();
            String exportPath = exportTask.getValue();
            
            Alert alert = new Alert(Alert.AlertType.INFORMATION);
            alert.setTitle("Export Successful");
            alert.setHeaderText("Module exported successfully!");
            alert.setContentText("Export saved to:\n" + exportPath + 
                               "\n\nWould you like to open the location?");
            
            ButtonType openButton = new ButtonType("Open Location");
            ButtonType closeButton = new ButtonType("Close", ButtonBar.ButtonData.CANCEL_CLOSE);
            alert.getButtonTypes().setAll(openButton, closeButton);
            
            Optional<ButtonType> result = alert.showAndWait();
            if (result.isPresent() && result.get() == openButton) {
                try {
                    Desktop.getDesktop().open(selectedDirectory);
                } catch (IOException e) {
                    e.printStackTrace();
                }
            }
        });
        
        exportTask.setOnFailed(event -> {
            progressAlert.close();
            Throwable exception = exportTask.getException();
            showError("Export failed: " + exception.getMessage());
            exception.printStackTrace();
        });
        
        new Thread(exportTask).start();
    }
    
    @FXML
    private void handleImportModule() {
        if (currentCourse == null) {
            showError("No course selected. Please open a course first.");
            return;
        }
        
        FileChooser fileChooser = new FileChooser();
        fileChooser.setTitle("Select Module Export File");
        fileChooser.setInitialDirectory(new File(System.getProperty("user.home")));
        fileChooser.getExtensionFilters().add(
            new FileChooser.ExtensionFilter("Module Export Files", "*.zip")
        );
        
        File selectedFile = fileChooser.showOpenDialog(importModuleButton.getScene().getWindow());
        if (selectedFile == null) {
            return;
        }
        
        // Show progress dialog
        Alert progressAlert = new Alert(Alert.AlertType.INFORMATION);
        progressAlert.setTitle("Importing Module");
        progressAlert.setHeaderText("Please wait while the module is being imported...");
        progressAlert.setContentText("This may take a few moments.");
        progressAlert.getDialogPane().lookupButton(ButtonType.OK).setVisible(false);
        progressAlert.show();
        
        javafx.concurrent.Task<ImportResult> importTask = new javafx.concurrent.Task<ImportResult>() {
            @Override
            protected ImportResult call() throws Exception {
                return moduleImportService.importModule(selectedFile.getAbsolutePath(), 
                                                       currentCourse.getId());
            }
        };
        
        importTask.setOnSucceeded(event -> {
            progressAlert.close();
            ImportResult result = importTask.getValue();
            
            Alert alert = new Alert(Alert.AlertType.INFORMATION);
            alert.setTitle("Import Successful");
            alert.setHeaderText("Module imported successfully!");
            alert.setContentText(result.getSummary());
            alert.showAndWait();
            
            // Refresh modules table
            refreshModules();
        });
        
        importTask.setOnFailed(event -> {
            progressAlert.close();
            Throwable exception = importTask.getException();
            
            Alert alert = new Alert(Alert.AlertType.ERROR);
            alert.setTitle("Import Failed");
            alert.setHeaderText("Failed to import module");
            alert.setContentText(exception.getMessage());
            alert.showAndWait();
            exception.printStackTrace();
        });
        
        new Thread(importTask).start();
    }
    
    private Callback<TableColumn<Module, Void>, TableCell<Module, Void>> createModuleActionButtons() {
        return new Callback<TableColumn<Module, Void>, TableCell<Module, Void>>() {
            @Override
            public TableCell<Module, Void> call(TableColumn<Module, Void> param) {
                return new TableCell<Module, Void>() {
                    private final Button exportButton = new Button("Export");
                    private final HBox buttons = new HBox(5);
                    
                    {
                        exportButton.setStyle("-fx-background-radius: 5; -fx-padding: 5 8; -fx-min-width: 60; -fx-background-color: #8e44ad; -fx-text-fill: white;");
                        
                        exportButton.setOnAction(e -> {
                            Module module = getTableView().getItems().get(getIndex());
                            handleExportModuleFromTable(module);
                        });
                        
                        buttons.getChildren().add(exportButton);
                    }
                    
                    @Override
                    protected void updateItem(Void item, boolean empty) {
                        super.updateItem(item, empty);
                        if (empty) {
                            setGraphic(null);
                        } else {
                            setGraphic(buttons);
                        }
                    }
                };
            }
        };
    }
    
    private void handleExportModuleFromTable(Module module) {
        DirectoryChooser directoryChooser = new DirectoryChooser();
        directoryChooser.setTitle("Select Export Location");
        directoryChooser.setInitialDirectory(new File(System.getProperty("user.home")));
        
        File selectedDirectory = directoryChooser.showDialog(modulesTable.getScene().getWindow());
        if (selectedDirectory == null) {
            return;
        }
        
        // Show progress dialog
        Alert progressAlert = new Alert(Alert.AlertType.INFORMATION);
        progressAlert.setTitle("Exporting Module");
        progressAlert.setHeaderText("Please wait while the module is being exported...");
        progressAlert.setContentText("This may take a few moments.");
        progressAlert.getDialogPane().lookupButton(ButtonType.OK).setVisible(false);
        progressAlert.show();
        
        javafx.concurrent.Task<String> exportTask = new javafx.concurrent.Task<String>() {
            @Override
            protected String call() throws Exception {
                return moduleExportService.exportModule(module.getId(), 
                                                       selectedDirectory.getAbsolutePath());
            }
        };
        
        exportTask.setOnSucceeded(event -> {
            progressAlert.close();
            String exportPath = exportTask.getValue();
            
            Alert alert = new Alert(Alert.AlertType.INFORMATION);
            alert.setTitle("Export Successful");
            alert.setHeaderText("Module exported successfully!");
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
            alert.setHeaderText("Failed to export module");
            alert.setContentText(exception.getMessage());
            alert.showAndWait();
            exception.printStackTrace();
        });
        
        new Thread(exportTask).start();
    }
    
    // Load all tasks from all modules
    private void loadAllTasks() {
        try {
            allTasksList.clear();
            List<Module> modules = moduleDAO.findByCourseId(currentCourse.getId());
            
            for (Module module : modules) {
                List<Task> tasks = taskDAO.findByModuleId(module.getId());
                for (Task task : tasks) {
                    allTasksList.add(new TaskWithModule(task, module.getModuleName()));
                }
            }
        } catch (Exception e) {
            e.printStackTrace();
            showError("Failed to load all tasks: " + e.getMessage());
        }
    }
    
    // Load all questions (module + course questions)
    private void loadAllQuestions() {
        try {
            allQuestionsList.clear();
            
            // Load module questions
            List<Module> modules = moduleDAO.findByCourseId(currentCourse.getId());
            for (Module module : modules) {
                List<CodingQuestion> questions = codingQuestionDAO.findModuleTests(module.getId());
                for (CodingQuestion question : questions) {
                    allQuestionsList.add(new QuestionWithModule(question, module.getModuleName()));
                }
            }
            
            // Load course questions
            List<CodingQuestion> courseQuestions = codingQuestionDAO.findCourseTests(currentCourse.getId());
            for (CodingQuestion question : courseQuestions) {
                allQuestionsList.add(new QuestionWithModule(question, "Course"));
            }
        } catch (Exception e) {
            e.printStackTrace();
            showError("Failed to load all questions: " + e.getMessage());
        }
    }
    
    // Create action buttons for tasks table
    private Callback<TableColumn<TaskWithModule, Void>, TableCell<TaskWithModule, Void>> createTaskActionButtons() {
        return new Callback<TableColumn<TaskWithModule, Void>, TableCell<TaskWithModule, Void>>() {
            @Override
            public TableCell<TaskWithModule, Void> call(TableColumn<TaskWithModule, Void> param) {
                return new TableCell<TaskWithModule, Void>() {
                    private final Button editButton = new Button("Edit");
                    private final Button deleteButton = new Button("Delete");
                    private final HBox buttons = new HBox(5);
                    
                    {
                        editButton.setStyle("-fx-background-radius: 5; -fx-padding: 5 8; -fx-min-width: 50; -fx-background-color: #f39c12; -fx-text-fill: white;");
                        deleteButton.setStyle("-fx-background-radius: 5; -fx-padding: 5 8; -fx-min-width: 50; -fx-background-color: #e74c3c; -fx-text-fill: white;");
                        
                        editButton.setOnAction(e -> {
                            TaskWithModule taskWithModule = getTableView().getItems().get(getIndex());
                            handleEditTaskFromTable(taskWithModule.getTask());
                        });
                        
                        deleteButton.setOnAction(e -> {
                            TaskWithModule taskWithModule = getTableView().getItems().get(getIndex());
                            handleDeleteTaskFromTable(taskWithModule.getTask());
                        });
                        
                        buttons.getChildren().addAll(editButton, deleteButton);
                    }
                    
                    @Override
                    protected void updateItem(Void item, boolean empty) {
                        super.updateItem(item, empty);
                        if (empty) {
                            setGraphic(null);
                        } else {
                            setGraphic(buttons);
                        }
                    }
                };
            }
        };
    }
    
    // Create action buttons for questions table
    private Callback<TableColumn<QuestionWithModule, Void>, TableCell<QuestionWithModule, Void>> createQuestionActionButtons() {
        return new Callback<TableColumn<QuestionWithModule, Void>, TableCell<QuestionWithModule, Void>>() {
            @Override
            public TableCell<QuestionWithModule, Void> call(TableColumn<QuestionWithModule, Void> param) {
                return new TableCell<QuestionWithModule, Void>() {
                    private final Button editButton = new Button("Edit");
                    private final Button deleteButton = new Button("Delete");
                    private final HBox buttons = new HBox(5);
                    
                    {
                        editButton.setStyle("-fx-background-radius: 5; -fx-padding: 5 8; -fx-min-width: 50; -fx-background-color: #f39c12; -fx-text-fill: white;");
                        deleteButton.setStyle("-fx-background-radius: 5; -fx-padding: 5 8; -fx-min-width: 50; -fx-background-color: #e74c3c; -fx-text-fill: white;");
                        
                        editButton.setOnAction(e -> {
                            QuestionWithModule questionWithModule = getTableView().getItems().get(getIndex());
                            handleEditQuestionFromTable(questionWithModule.getQuestion());
                        });
                        
                        deleteButton.setOnAction(e -> {
                            QuestionWithModule questionWithModule = getTableView().getItems().get(getIndex());
                            handleDeleteQuestionFromTable(questionWithModule.getQuestion());
                        });
                        
                        buttons.getChildren().addAll(editButton, deleteButton);
                    }
                    
                    @Override
                    protected void updateItem(Void item, boolean empty) {
                        super.updateItem(item, empty);
                        if (empty) {
                            setGraphic(null);
                        } else {
                            setGraphic(buttons);
                        }
                    }
                };
            }
        };
    }
    
    // Handle edit task from table
    private void handleEditTaskFromTable(Task task) {
        try {
            FXMLLoader loader = new FXMLLoader(getClass().getResource("/fxml/TaskDialog.fxml"));
            Parent root = loader.load();

            TaskDialogController controller = loader.getController();
            Module module = moduleDAO.findById(task.getModuleId());
            controller.setModule(module);
            controller.setTask(task);
            controller.setParentController(null); // Will refresh via refreshModules

            Stage stage = new Stage();
            stage.setTitle("Edit Task");
            stage.setScene(new Scene(root));
            stage.getScene().getStylesheets().add(getClass().getResource("/css/style.css").toExternalForm());
            stage.initModality(Modality.WINDOW_MODAL);
            stage.initOwner(allTasksTable.getScene().getWindow());
            stage.setResizable(true);
            stage.setOnHidden(e -> {
                refreshModules(); // Refresh all tables
            });
            stage.showAndWait();

        } catch (Exception e) {
            e.printStackTrace();
            showError("Failed to open edit task dialog: " + e.getMessage());
        }
    }
    
    // Handle delete task from table
    private void handleDeleteTaskFromTable(Task task) {
        Alert confirmAlert = new Alert(Alert.AlertType.CONFIRMATION);
        confirmAlert.setTitle("Confirm Delete");
        confirmAlert.setHeaderText("Delete Task");
        confirmAlert.setContentText("Are you sure you want to delete the task '" + task.getTaskName() + "'?\n\nThis action cannot be undone.");

        Optional<ButtonType> result = confirmAlert.showAndWait();
        if (result.isPresent() && result.get() == ButtonType.OK) {
            try {
                taskDAO.delete(task.getId());
                refreshModules(); // Refresh all tables
                
                Alert successAlert = new Alert(Alert.AlertType.INFORMATION);
                successAlert.setTitle("Success");
                successAlert.setHeaderText(null);
                successAlert.setContentText("Task deleted successfully!");
                successAlert.showAndWait();

            } catch (Exception e) {
                e.printStackTrace();
                showError("Failed to delete task: " + e.getMessage());
            }
        }
    }
    
    // Handle edit question from table
    private void handleEditQuestionFromTable(CodingQuestion question) {
        try {
            FXMLLoader loader = new FXMLLoader(getClass().getResource("/fxml/CodingQuestionDialog.fxml"));
            Parent root = loader.load();

            CodingQuestionDialogController controller = loader.getController();
            controller.setCourse(currentCourse);
            controller.setQuestionType(question.getQuestionType());
            controller.setCodingQuestion(question);
            controller.setParentController(this);

            Stage stage = new Stage();
            stage.setTitle("Edit Question");
            stage.setScene(new Scene(root));
            stage.getScene().getStylesheets().add(getClass().getResource("/css/style.css").toExternalForm());
            stage.initModality(Modality.WINDOW_MODAL);
            stage.initOwner(allQuestionsTable.getScene().getWindow());
            stage.setResizable(true);
            stage.setOnHidden(e -> {
                refreshModules(); // Refresh all tables
                refreshCourseTests(); // Also refresh course tests if it's a course question
            });
            stage.showAndWait();

        } catch (Exception e) {
            e.printStackTrace();
            showError("Failed to open edit question dialog: " + e.getMessage());
        }
    }
    
    // Handle delete question from table
    private void handleDeleteQuestionFromTable(CodingQuestion question) {
        String questionPreview = question.getQuestionText();
        if (questionPreview != null && questionPreview.length() > 50) {
            questionPreview = questionPreview.substring(0, 47) + "...";
        }
        
        Alert confirmAlert = new Alert(Alert.AlertType.CONFIRMATION);
        confirmAlert.setTitle("Confirm Delete");
        confirmAlert.setHeaderText("Delete Question");
        confirmAlert.setContentText("Are you sure you want to delete this question?\n\n" +
                "Question: " + questionPreview + "\n\nThis action cannot be undone.");

        Optional<ButtonType> result = confirmAlert.showAndWait();
        if (result.isPresent() && result.get() == ButtonType.OK) {
            try {
                codingQuestionDAO.delete(question.getId());
                refreshModules(); // Refresh all tables
                refreshCourseTests(); // Also refresh course tests if it's a course question
                
                Alert successAlert = new Alert(Alert.AlertType.INFORMATION);
                successAlert.setTitle("Success");
                successAlert.setHeaderText(null);
                successAlert.setContentText("Question deleted successfully!");
                successAlert.showAndWait();

            } catch (Exception e) {
                e.printStackTrace();
                showError("Failed to delete question: " + e.getMessage());
            }
        }
    }
    
    // Helper class to wrap Task with module name
    public static class TaskWithModule {
        private final Task task;
        private final String moduleName;
        
        public TaskWithModule(Task task, String moduleName) {
            this.task = task;
            this.moduleName = moduleName;
        }
        
        public Task getTask() {
            return task;
        }
        
        public String getModuleName() {
            return moduleName;
        }
    }
    
    // Helper class to wrap CodingQuestion with module name
    public static class QuestionWithModule {
        private final CodingQuestion question;
        private final String moduleName;
        
        public QuestionWithModule(CodingQuestion question, String moduleName) {
            this.question = question;
            this.moduleName = moduleName;
        }
        
        public CodingQuestion getQuestion() {
            return question;
        }
        
        public String getModuleName() {
            return moduleName;
        }
    }
}