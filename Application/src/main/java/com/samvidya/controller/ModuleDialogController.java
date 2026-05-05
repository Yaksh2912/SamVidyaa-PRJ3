package com.samvidya.controller;

import com.samvidya.dao.ModuleDAO;
import com.samvidya.dao.TaskDAO;
import com.samvidya.dao.CodingQuestionDAO;
import com.samvidya.model.Course;
import com.samvidya.model.Module;
import com.samvidya.model.Task;
import com.samvidya.model.CodingQuestion;
import javafx.collections.FXCollections;
import javafx.collections.ObservableList;
import javafx.fxml.FXML;
import javafx.fxml.FXMLLoader;
import javafx.scene.Parent;
import javafx.scene.Scene;
import javafx.scene.control.*;
import javafx.scene.control.cell.PropertyValueFactory;
import javafx.stage.Modality;
import javafx.stage.Stage;

import java.util.List;
import java.util.Optional;

public class ModuleDialogController {

    @FXML
    private Label titleLabel;

    @FXML
    private TextField moduleNameField;

    @FXML
    private TextArea descriptionArea;

    @FXML
    private Spinner<Integer> moduleOrderSpinner;

    @FXML
    private Spinner<Integer> tasksPerModuleSpinner;

    @FXML
    private Spinner<Integer> moduleTestQuestionsSpinner;

    @FXML
    private CheckBox activeCheckBox;

    // Task Table
    @FXML
    private TableView<Task> tasksTable;

    @FXML
    private TableColumn<Task, String> taskNameColumn;

    @FXML
    private TableColumn<Task, Integer> taskPointsColumn;

    @FXML
    private TableColumn<Task, String> taskLanguageColumn;

    @FXML
    private TableColumn<Task, String> taskDifficultyColumn;

    @FXML
    private TableColumn<Task, Integer> taskTimeLimitColumn;

    @FXML
    private TableColumn<Task, Integer> taskTestCasesColumn;

    @FXML
    private Button addTaskButton;

    @FXML
    private Button editTaskButton;

    @FXML
    private Button deleteTaskButton;

    // Test Table
    @FXML
    private TableView<CodingQuestion> testsTable;

    @FXML
    private TableColumn<CodingQuestion, String> testQuestionColumn;

    @FXML
    private TableColumn<CodingQuestion, Integer> testPointsColumn;

    @FXML
    private TableColumn<CodingQuestion, String> testLanguageColumn;

    @FXML
    private TableColumn<CodingQuestion, String> testDifficultyColumn;

    @FXML
    private TableColumn<CodingQuestion, Integer> testTimeLimitColumn;

    @FXML
    private TableColumn<CodingQuestion, Integer> testTestCasesColumn;

    @FXML
    private Button addTestButton;

    @FXML
    private Button editTestButton;

    @FXML
    private Button deleteTestButton;

    @FXML
    private Button saveButton;

    @FXML
    private Button cancelButton;

    @FXML
    private Label errorLabel;

    private Course currentCourse;
    private Module currentModule; // null for new module
    private ModuleDAO moduleDAO;
    private TaskDAO taskDAO;
    private CodingQuestionDAO codingQuestionDAO;
    private ObservableList<Task> tasksList;
    private ObservableList<CodingQuestion> testsList;
    private CourseManagementController parentController;

    @FXML
    private void initialize() {
        moduleDAO = new ModuleDAO();
        taskDAO = new TaskDAO();
        codingQuestionDAO = new CodingQuestionDAO();
        tasksList = FXCollections.observableArrayList();
        testsList = FXCollections.observableArrayList();
        errorLabel.setVisible(false);

        // Setup spinners with default values
        moduleOrderSpinner.setValueFactory(new SpinnerValueFactory.IntegerSpinnerValueFactory(1, 50, 1));
        tasksPerModuleSpinner.setValueFactory(new SpinnerValueFactory.IntegerSpinnerValueFactory(5, 50, 10));
        moduleTestQuestionsSpinner.setValueFactory(new SpinnerValueFactory.IntegerSpinnerValueFactory(1, 20, 3));

        // Set active by default
        activeCheckBox.setSelected(true);

        // Setup tasks table
        taskNameColumn.setCellValueFactory(cellData -> {
            String taskName = cellData.getValue().getTaskName();
            if (taskName != null && taskName.length() > 30) {
                taskName = taskName.substring(0, 27) + "...";
            }
            return new javafx.beans.property.SimpleStringProperty(taskName);
        });
        taskPointsColumn.setCellValueFactory(new PropertyValueFactory<>("points"));
        taskLanguageColumn.setCellValueFactory(new PropertyValueFactory<>("language"));
        taskDifficultyColumn.setCellValueFactory(new PropertyValueFactory<>("difficulty"));
        taskTimeLimitColumn.setCellValueFactory(new PropertyValueFactory<>("timeLimit"));
        taskTestCasesColumn.setCellValueFactory(new PropertyValueFactory<>("testCasesCount"));

        tasksTable.setItems(tasksList);

        // Setup tests table
        testQuestionColumn.setCellValueFactory(cellData -> {
            String questionText = cellData.getValue().getQuestionText();
            if (questionText != null && questionText.length() > 30) {
                questionText = questionText.substring(0, 27) + "...";
            }
            return new javafx.beans.property.SimpleStringProperty(questionText);
        });
        testPointsColumn.setCellValueFactory(new PropertyValueFactory<>("points"));
        testLanguageColumn.setCellValueFactory(new PropertyValueFactory<>("language"));
        testDifficultyColumn.setCellValueFactory(new PropertyValueFactory<>("difficulty"));
        testTimeLimitColumn.setCellValueFactory(new PropertyValueFactory<>("timeLimit"));
        testTestCasesColumn.setCellValueFactory(new PropertyValueFactory<>("testCasesCount"));

        testsTable.setItems(testsList);

        // Setup table selection listeners
        tasksTable.getSelectionModel().selectedItemProperty().addListener((obs, oldSelection, newSelection) -> {
            boolean hasSelection = newSelection != null;
            editTaskButton.setDisable(!hasSelection);
            deleteTaskButton.setDisable(!hasSelection);
        });

        testsTable.getSelectionModel().selectedItemProperty().addListener((obs, oldSelection, newSelection) -> {
            boolean hasSelection = newSelection != null;
            editTestButton.setDisable(!hasSelection);
            deleteTestButton.setDisable(!hasSelection);
        });

        // Setup double-click to edit
        tasksTable.setRowFactory(tv -> {
            TableRow<Task> row = new TableRow<>();
            row.setOnMouseClicked(event -> {
                if (event.getClickCount() == 2 && !row.isEmpty()) {
                    handleEditTask();
                }
            });
            return row;
        });

        testsTable.setRowFactory(tv -> {
            TableRow<CodingQuestion> row = new TableRow<>();
            row.setOnMouseClicked(event -> {
                if (event.getClickCount() == 2 && !row.isEmpty()) {
                    handleEditTest();
                }
            });
            return row;
        });

        // Initially disable buttons
        editTaskButton.setDisable(true);
        deleteTaskButton.setDisable(true);
        editTestButton.setDisable(true);
        deleteTestButton.setDisable(true);
    }

    public void setCourse(Course course) {
        this.currentCourse = course;
    }

    public void setModule(Module module) {
        this.currentModule = module;
        if (module != null) {
            // Edit mode
            titleLabel.setText("Edit Module - " + module.getModuleName());
            saveButton.setText("Update Module");
            populateFields();
            loadTasks();
            loadTests();
        } else {
            // Add mode
            titleLabel.setText("Add New Module");
            saveButton.setText("Create Module");
            setNextModuleOrder();
        }
    }

    public void setParentController(CourseManagementController parentController) {
        this.parentController = parentController;
    }

    private void populateFields() {
        if (currentModule != null) {
            moduleNameField.setText(currentModule.getModuleName());
            descriptionArea.setText(currentModule.getDescription());
            moduleOrderSpinner.getValueFactory().setValue(currentModule.getModuleOrder());
            tasksPerModuleSpinner.getValueFactory().setValue(currentModule.getTasksPerModule());
            moduleTestQuestionsSpinner.getValueFactory().setValue(currentModule.getModuleTestQuestions());
            activeCheckBox.setSelected(currentModule.isActive());
        }
    }

    private void setNextModuleOrder() {
        try {
            // Get existing modules and set next order
            var existingModules = moduleDAO.findByCourseId(currentCourse.getId());
            int nextOrder = existingModules.size() + 1;
            moduleOrderSpinner.getValueFactory().setValue(nextOrder);
        } catch (Exception e) {
            e.printStackTrace();
            // Default to 1 if error
            moduleOrderSpinner.getValueFactory().setValue(1);
        }
    }

    private void loadTasks() {
        if (currentModule != null && currentModule.getId() != null) {
            try {
                List<Task> tasks = taskDAO.findByModuleId(currentModule.getId());
                tasksList.clear();
                tasksList.addAll(tasks);
            } catch (Exception e) {
                e.printStackTrace();
                showError("Failed to load tasks: " + e.getMessage());
            }
        }
    }

    private void loadTests() {
        if (currentModule != null && currentModule.getId() != null) {
            try {
                List<CodingQuestion> tests = codingQuestionDAO.findModuleTests(currentModule.getId());
                testsList.clear();
                testsList.addAll(tests);
            } catch (Exception e) {
                e.printStackTrace();
                showError("Failed to load tests: " + e.getMessage());
            }
        }
    }

    @FXML
    private void handleAddTask() {
        if (currentModule == null || currentModule.getId() == null) {
            showError("Please save the module first before adding tasks.");
            return;
        }

        try {
            FXMLLoader loader = new FXMLLoader(getClass().getResource("/fxml/TaskDialog.fxml"));
            Parent root = loader.load();

            TaskDialogController controller = loader.getController();
            controller.setModule(currentModule);
            controller.setModuleParentController(this);

            Stage stage = new Stage();
            stage.setTitle("Add Task");
            stage.setScene(new Scene(root));
            stage.getScene().getStylesheets().add(getClass().getResource("/css/style.css").toExternalForm());
            stage.initModality(Modality.WINDOW_MODAL);
            stage.initOwner(addTaskButton.getScene().getWindow());
            stage.setResizable(true);
            stage.showAndWait();

        } catch (Exception e) {
            e.printStackTrace();
            showError("Failed to open add task dialog: " + e.getMessage());
        }
    }

    @FXML
    private void handleEditTask() {
        Task selectedTask = tasksTable.getSelectionModel().getSelectedItem();
        if (selectedTask == null) {
            showError("Please select a task to edit");
            return;
        }

        try {
            FXMLLoader loader = new FXMLLoader(getClass().getResource("/fxml/TaskDialog.fxml"));
            Parent root = loader.load();

            TaskDialogController controller = loader.getController();
            controller.setModule(currentModule);
            controller.setTask(selectedTask);
            controller.setModuleParentController(this);

            Stage stage = new Stage();
            stage.setTitle("Edit Task");
            stage.setScene(new Scene(root));
            stage.getScene().getStylesheets().add(getClass().getResource("/css/style.css").toExternalForm());
            stage.initModality(Modality.WINDOW_MODAL);
            stage.initOwner(editTaskButton.getScene().getWindow());
            stage.setResizable(true);
            stage.showAndWait();

        } catch (Exception e) {
            e.printStackTrace();
            showError("Failed to open edit task dialog: " + e.getMessage());
        }
    }

    @FXML
    private void handleDeleteTask() {
        Task selectedTask = tasksTable.getSelectionModel().getSelectedItem();
        if (selectedTask == null) {
            showError("Please select a task to delete");
            return;
        }

        Alert confirmAlert = new Alert(Alert.AlertType.CONFIRMATION);
        confirmAlert.setTitle("Confirm Delete");
        confirmAlert.setHeaderText("Delete Task");
        confirmAlert.setContentText("Are you sure you want to delete the task '" + selectedTask.getTaskName() + "'?\n\nThis action cannot be undone.");

        Optional<ButtonType> result = confirmAlert.showAndWait();
        if (result.isPresent() && result.get() == ButtonType.OK) {
            try {
                taskDAO.delete(selectedTask.getId());
                loadTasks(); // Refresh the table
                
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

    @FXML
    private void handleAddTest() {
        if (currentModule == null || currentModule.getId() == null) {
            showError("Please save the module first before adding tests.");
            return;
        }

        try {
            FXMLLoader loader = new FXMLLoader(getClass().getResource("/fxml/CodingQuestionDialog.fxml"));
            Parent root = loader.load();

            CodingQuestionDialogController controller = loader.getController();
            controller.setModuleAndCourse(currentModule.getId(), currentCourse.getId());
            controller.setQuestionType("MODULE_TEST");
            // Don't set parent controller as it's a different type

            Stage stage = new Stage();
            stage.setTitle("Add Module Test");
            stage.setScene(new Scene(root));
            stage.getScene().getStylesheets().add(getClass().getResource("/css/style.css").toExternalForm());
            stage.initModality(Modality.WINDOW_MODAL);
            stage.initOwner(addTestButton.getScene().getWindow());
            stage.setResizable(true);
            stage.showAndWait();

        } catch (Exception e) {
            e.printStackTrace();
            showError("Failed to open add test dialog: " + e.getMessage());
        }
    }

    @FXML
    private void handleEditTest() {
        CodingQuestion selectedTest = testsTable.getSelectionModel().getSelectedItem();
        if (selectedTest == null) {
            showError("Please select a test to edit");
            return;
        }

        try {
            FXMLLoader loader = new FXMLLoader(getClass().getResource("/fxml/CodingQuestionDialog.fxml"));
            Parent root = loader.load();

            CodingQuestionDialogController controller = loader.getController();
            controller.setModuleAndCourse(currentModule.getId(), currentCourse.getId());
            controller.setQuestionType("MODULE_TEST");
            controller.setCodingQuestion(selectedTest);
            // Don't set parent controller as it's a different type

            Stage stage = new Stage();
            stage.setTitle("Edit Module Test");
            stage.setScene(new Scene(root));
            stage.getScene().getStylesheets().add(getClass().getResource("/css/style.css").toExternalForm());
            stage.initModality(Modality.WINDOW_MODAL);
            stage.initOwner(editTestButton.getScene().getWindow());
            stage.setResizable(true);
            stage.showAndWait();

        } catch (Exception e) {
            e.printStackTrace();
            showError("Failed to open edit test dialog: " + e.getMessage());
        }
    }

    @FXML
    private void handleDeleteTest() {
        CodingQuestion selectedTest = testsTable.getSelectionModel().getSelectedItem();
        if (selectedTest == null) {
            showError("Please select a test to delete");
            return;
        }

        Alert confirmAlert = new Alert(Alert.AlertType.CONFIRMATION);
        confirmAlert.setTitle("Confirm Delete");
        confirmAlert.setHeaderText("Delete Module Test");
        confirmAlert.setContentText("Are you sure you want to delete this test question?\n\nThis action cannot be undone.");

        Optional<ButtonType> result = confirmAlert.showAndWait();
        if (result.isPresent() && result.get() == ButtonType.OK) {
            try {
                codingQuestionDAO.delete(selectedTest.getId());
                loadTests(); // Refresh the table
                
                Alert successAlert = new Alert(Alert.AlertType.INFORMATION);
                successAlert.setTitle("Success");
                successAlert.setHeaderText(null);
                successAlert.setContentText("Test question deleted successfully!");
                successAlert.showAndWait();

            } catch (Exception e) {
                e.printStackTrace();
                showError("Failed to delete test question: " + e.getMessage());
            }
        }
    }

    @FXML
    private void handleSave() {
        if (!validateInput()) {
            return;
        }

        try {
            Module module;
            if (currentModule == null) {
                // Create new module
                module = new Module();
                module.setCourseId(currentCourse.getId());
            } else {
                // Update existing module
                module = currentModule;
            }

            // Set module properties
            module.setModuleName(moduleNameField.getText().trim());
            module.setDescription(descriptionArea.getText().trim());
            module.setModuleOrder(moduleOrderSpinner.getValue());
            module.setTasksPerModule(tasksPerModuleSpinner.getValue());
            module.setModuleTestQuestions(moduleTestQuestionsSpinner.getValue());
            module.setActive(activeCheckBox.isSelected());

            // Save to database
            Long moduleId = moduleDAO.save(module);
            
            // If this was a new module, update currentModule for task/test operations
            if (currentModule == null) {
                currentModule = module;
                currentModule.setId(moduleId);
                // Update title and enable task/test operations
                titleLabel.setText("Edit Module - " + module.getModuleName());
                saveButton.setText("Update Module");
            }

            // Show success message
            Alert alert = new Alert(Alert.AlertType.INFORMATION);
            alert.setTitle("Success");
            alert.setHeaderText(null);
            alert.setContentText(currentModule.getId() == null ? "Module created successfully!" : "Module updated successfully!");
            alert.showAndWait();

            // Refresh parent controller
            if (parentController != null) {
                parentController.refreshModules();
            }

        } catch (Exception e) {
            e.printStackTrace();
            showError("Failed to save module: " + e.getMessage());
        }
    }

    @FXML
    private void handleCancel() {
        closeDialog();
    }

    public void refreshTasks() {
        loadTasks();
    }

    public void refreshTests() {
        loadTests();
    }

    // Method for CodingQuestionDialogController callback
    public void setParentController(ModuleDialogController parentController) {
        // This method is called by CodingQuestionDialogController
        // We don't need to store the reference as refresh methods are called directly
    }

    private boolean validateInput() {
        StringBuilder errors = new StringBuilder();

        if (moduleNameField.getText().trim().isEmpty()) {
            errors.append("Module name is required.\n");
        }

        if (moduleOrderSpinner.getValue() < 1) {
            errors.append("Module order must be at least 1.\n");
        }

        if (tasksPerModuleSpinner.getValue() < 1) {
            errors.append("Tasks per module must be at least 1.\n");
        }

        if (moduleTestQuestionsSpinner.getValue() < 1) {
            errors.append("Module test questions must be at least 1.\n");
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

    private void closeDialog() {
        Stage stage = (Stage) saveButton.getScene().getWindow();
        stage.close();
    }
}