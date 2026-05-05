package com.samvidya.controller;

import com.samvidya.dao.TaskDAO;
import com.samvidya.dao.TestCaseDAO;
import com.samvidya.model.Module;
import com.samvidya.model.Task;
import com.samvidya.model.TestCase;
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

public class TaskDialogController {

    @FXML
    private Label titleLabel;

    @FXML
    private TextField taskNameField;

    @FXML
    private TextArea descriptionArea;

    @FXML
    private TextArea problemStatementArea;

    @FXML
    private ComboBox<String> difficultyComboBox;

    @FXML
    private Spinner<Integer> pointsSpinner;

    @FXML
    private Spinner<Integer> timeLimitSpinner;

    @FXML
    private ComboBox<String> languageComboBox;

    @FXML
    private TableView<TestCase> testCasesTable;

    @FXML
    private TableColumn<TestCase, String> testTypeColumn;

    @FXML
    private TableColumn<TestCase, String> inputColumn;

    @FXML
    private TableColumn<TestCase, String> outputColumn;

    @FXML
    private TableColumn<TestCase, Double> testPointsColumn;

    @FXML
    private Button addTestCaseButton;

    @FXML
    private Button editTestCaseButton;

    @FXML
    private Button deleteTestCaseButton;

    @FXML
    private Button distributePointsButton;

    @FXML
    private Label testCaseStatsLabel;

    @FXML
    private Button saveButton;

    @FXML
    private Button cancelButton;

    @FXML
    private Label errorLabel;

    private Module currentModule;
    private Task currentTask; // null for new task
    private TaskDAO taskDAO;
    private TestCaseDAO testCaseDAO;
    private CourseManagementController parentController;
    private ModuleDialogController moduleParentController;
    private ObservableList<TestCase> testCasesList;
    private ObservableList<TestCase> inMemoryTestCases; // For storing test cases before task is saved

    @FXML
    private void initialize() {
        taskDAO = new TaskDAO();
        testCaseDAO = new TestCaseDAO();
        testCasesList = FXCollections.observableArrayList();
        inMemoryTestCases = FXCollections.observableArrayList();
        errorLabel.setVisible(false);

        // Setup difficulty options
        difficultyComboBox.getItems().addAll("EASY", "MEDIUM", "HARD");
        difficultyComboBox.setValue("MEDIUM");

        // Setup language options
        languageComboBox.getItems().addAll("Python", "Java", "C++", "JavaScript", "C");
        languageComboBox.setValue("Python");

        // Setup spinners with default values
        pointsSpinner.setValueFactory(new SpinnerValueFactory.IntegerSpinnerValueFactory(1, 100, 10));
        timeLimitSpinner.setValueFactory(new SpinnerValueFactory.IntegerSpinnerValueFactory(5, 180, 30));

        // Add listener to points spinner to update test case stats
        pointsSpinner.valueProperty().addListener((obs, oldValue, newValue) -> {
            updateTestCaseStats();
            testCasesTable.refresh(); // Refresh table to show updated points
        });

        // Setup test cases table
        testTypeColumn.setCellValueFactory(cellData -> 
            new javafx.beans.property.SimpleStringProperty(cellData.getValue().isSample() ? "Sample" : "Validation"));
        inputColumn.setCellValueFactory(cellData -> 
            new javafx.beans.property.SimpleStringProperty(truncateText(cellData.getValue().getInput(), 30)));
        outputColumn.setCellValueFactory(cellData -> 
            new javafx.beans.property.SimpleStringProperty(truncateText(cellData.getValue().getExpectedOutput(), 30)));
        testPointsColumn.setCellValueFactory(cellData -> {
            TestCase testCase = cellData.getValue();
            if (testCase.isSample()) {
                return new javafx.beans.property.SimpleDoubleProperty(0.0).asObject();
            } else {
                // Calculate points based on total task points and validation count
                int totalPoints = pointsSpinner.getValue();
                // Use the appropriate list based on whether task is saved or not
                ObservableList<TestCase> currentList = (currentTask == null) ? inMemoryTestCases : testCasesList;
                long validationCount = currentList.stream().filter(tc -> !tc.isSample()).count();
                double points = validationCount > 0 ? (double) totalPoints / validationCount : 0.0;
                return new javafx.beans.property.SimpleDoubleProperty(points).asObject();
            }
        });

        testCasesTable.setItems(testCasesList);

        // Setup table selection listener
        testCasesTable.getSelectionModel().selectedItemProperty().addListener((obs, oldSelection, newSelection) -> {
            boolean hasSelection = newSelection != null;
            editTestCaseButton.setDisable(!hasSelection);
            deleteTestCaseButton.setDisable(!hasSelection);
        });

        // Initially disable buttons
        editTestCaseButton.setDisable(true);
        deleteTestCaseButton.setDisable(true);
    }

    public void setModule(Module module) {
        this.currentModule = module;
    }

    public void setTask(Task task) {
        this.currentTask = task;
        if (task != null) {
            // Edit mode
            titleLabel.setText("Edit Task");
            saveButton.setText("Update Task");
            populateFields();
            loadTestCases();
        } else {
            // Add mode
            titleLabel.setText("Add New Task");
            saveButton.setText("Create Task");
            // For new tasks, use in-memory storage
            testCasesList.clear();
            testCasesList.addAll(inMemoryTestCases);
            updateTestCaseStats();
        }
    }

    public void setParentController(CourseManagementController parentController) {
        this.parentController = parentController;
    }

    public void setModuleParentController(ModuleDialogController parentController) {
        // For module dialog parent, we'll handle refresh differently
        this.moduleParentController = parentController;
    }

    private void populateFields() {
        if (currentTask != null) {
            taskNameField.setText(currentTask.getTaskName());
            descriptionArea.setText(currentTask.getDescription());
            problemStatementArea.setText(currentTask.getProblemStatement());
            difficultyComboBox.setValue(currentTask.getDifficulty());
            pointsSpinner.getValueFactory().setValue(currentTask.getPoints());
            timeLimitSpinner.getValueFactory().setValue(currentTask.getTimeLimit());
            languageComboBox.setValue(currentTask.getLanguage());
        }
    }

    private void loadTestCases() {
        if (currentTask != null && currentTask.getId() != null) {
            try {
                List<TestCase> testCases = testCaseDAO.findByTaskId(currentTask.getId());
                testCasesList.clear();
                testCasesList.addAll(testCases);
                updateTestCaseStats();
            } catch (Exception e) {
                e.printStackTrace();
                showError("Failed to load test cases: " + e.getMessage());
            }
        }
    }

    private void updateTestCaseStats() {
        int sampleCount = 0;
        int validationCount = 0;

        // Use the appropriate list based on whether task is saved or not
        ObservableList<TestCase> currentList = (currentTask == null) ? inMemoryTestCases : testCasesList;
        
        for (TestCase testCase : currentList) {
            if (testCase.isSample()) {
                sampleCount++;
            } else {
                validationCount++;
            }
        }

        double pointsPerValidation = validationCount > 0 ? (double) pointsSpinner.getValue() / validationCount : 0.0;
        
        testCaseStatsLabel.setText(String.format("Sample: %d, Validation: %d, Points per validation: %.2f", 
                                                sampleCount, validationCount, pointsPerValidation));
    }

    @FXML
    private void handleAddTestCase() {
        openTestCaseDialog(null);
    }

    @FXML
    private void handleEditTestCase() {
        TestCase selectedTestCase = testCasesTable.getSelectionModel().getSelectedItem();
        if (selectedTestCase == null) {
            showError("Please select a test case to edit");
            return;
        }
        openTestCaseDialog(selectedTestCase);
    }

    private void openTestCaseDialog(TestCase testCase) {
        try {
            FXMLLoader loader = new FXMLLoader(getClass().getResource("/fxml/TestCaseDialog.fxml"));
            Parent root = loader.load();

            TestCaseDialogController controller = loader.getController();
            
            // For new tasks, we'll handle test cases in memory
            if (currentTask == null || currentTask.getId() == null) {
                controller.setTaskId(-1L); // Special value to indicate in-memory storage
                controller.setParentController(this); // Set parent controller for callback
            } else {
                controller.setTaskId(currentTask.getId());
            }
            
            controller.setTestCase(testCase);

            Stage stage = new Stage();
            stage.setTitle(testCase == null ? "Add Test Case" : "Edit Test Case");
            stage.setScene(new Scene(root));
            stage.getScene().getStylesheets().add(getClass().getResource("/css/style.css").toExternalForm());
            stage.initModality(Modality.WINDOW_MODAL);
            stage.initOwner(addTestCaseButton.getScene().getWindow());
            stage.setResizable(false);
            stage.showAndWait();

            // Refresh test cases after dialog closes
            if (currentTask != null && currentTask.getId() != null) {
                loadTestCases();
            } else {
                // For new tasks, refresh the in-memory display
                testCasesList.clear();
                testCasesList.addAll(inMemoryTestCases);
                updateTestCaseStats();
            }

        } catch (Exception e) {
            e.printStackTrace();
            showError("Failed to open test case dialog: " + e.getMessage());
        }
    }

    @FXML
    private void handleDeleteTestCase() {
        TestCase selectedTestCase = testCasesTable.getSelectionModel().getSelectedItem();
        if (selectedTestCase == null) {
            showError("Please select a test case to delete");
            return;
        }

        Alert confirmAlert = new Alert(Alert.AlertType.CONFIRMATION);
        confirmAlert.setTitle("Confirm Delete");
        confirmAlert.setHeaderText("Delete Test Case");
        confirmAlert.setContentText("Are you sure you want to delete this test case?");

        Optional<ButtonType> result = confirmAlert.showAndWait();
        if (result.isPresent() && result.get() == ButtonType.OK) {
            try {
                if (currentTask != null && currentTask.getId() != null) {
                    // Delete from database for existing tasks
                    testCaseDAO.delete(selectedTestCase.getId());
                    loadTestCases(); // Refresh the table
                } else {
                    // Delete from in-memory storage for new tasks
                    inMemoryTestCases.removeIf(tc -> tc.getId().equals(selectedTestCase.getId()));
                    testCasesList.clear();
                    testCasesList.addAll(inMemoryTestCases);
                    updateTestCaseStats();
                }

            } catch (Exception e) {
                e.printStackTrace();
                showError("Failed to delete test case: " + e.getMessage());
            }
        }
    }

    @FXML
    private void handleDistributePoints() {
        // Points are automatically distributed, just refresh the display
        updateTestCaseStats();
        testCasesTable.refresh(); // Refresh table to show updated points
        
        Alert alert = new Alert(Alert.AlertType.INFORMATION);
        alert.setTitle("Points Distribution");
        alert.setHeaderText(null);
        
        int validationCount = (int) testCasesList.stream().filter(tc -> !tc.isSample()).count();
        if (validationCount > 0) {
            double pointsPerValidation = (double) pointsSpinner.getValue() / validationCount;
            alert.setContentText(String.format("Points automatically distributed: %.2f points per validation test case", pointsPerValidation));
        } else {
            alert.setContentText("No validation test cases found. Add validation test cases to distribute points.");
        }
        
        alert.showAndWait();
    }

    @FXML
    private void handleSave() {
        if (!validateInput()) {
            return;
        }

        try {
            Task task;
            boolean isNewTask = false;
            
            if (currentTask == null) {
                // Create new task
                task = new Task();
                task.setModuleId(currentModule.getId());
                isNewTask = true;
            } else {
                // Update existing task
                task = currentTask;
            }

            // Set task properties
            task.setTaskName(taskNameField.getText().trim());
            task.setDescription(descriptionArea.getText().trim());
            task.setProblemStatement(problemStatementArea.getText().trim());
            task.setDifficulty(difficultyComboBox.getValue());
            task.setPoints(pointsSpinner.getValue());
            task.setTimeLimit(timeLimitSpinner.getValue());
            task.setLanguage(languageComboBox.getValue());

            // Save to database
            Long taskId = taskDAO.save(task);
            
            // If new task, save all in-memory test cases to database
            if (isNewTask && !inMemoryTestCases.isEmpty()) {
                for (TestCase testCase : inMemoryTestCases) {
                    testCase.setTaskId(taskId);
                    testCase.setId(null); // Reset ID so it gets a new one from database
                    testCaseDAO.save(testCase);
                }
            }

            // Show success message
            Alert alert = new Alert(Alert.AlertType.INFORMATION);
            alert.setTitle("Success");
            alert.setHeaderText(null);
            alert.setContentText(currentTask == null ? "Task created successfully!" : "Task updated successfully!");
            alert.showAndWait();

            // Refresh parent controller
            if (parentController != null) {
                parentController.refreshModules();
            } else if (moduleParentController != null) {
                moduleParentController.refreshTasks();
            }

            // Close dialog
            closeDialog();

        } catch (Exception e) {
            e.printStackTrace();
            showError("Failed to save task: " + e.getMessage());
        }
    }

    @FXML
    private void handleCancel() {
        closeDialog();
    }

    private boolean validateInput() {
        StringBuilder errors = new StringBuilder();

        if (taskNameField.getText().trim().isEmpty()) {
            errors.append("Task name is required.\n");
        }

        if (problemStatementArea.getText().trim().isEmpty()) {
            errors.append("Problem statement is required.\n");
        }

        if (difficultyComboBox.getValue() == null) {
            errors.append("Difficulty is required.\n");
        }

        if (languageComboBox.getValue() == null) {
            errors.append("Language is required.\n");
        }

        if (pointsSpinner.getValue() < 1) {
            errors.append("Points must be at least 1.\n");
        }

        if (timeLimitSpinner.getValue() < 1) {
            errors.append("Time limit must be at least 1 minute.\n");
        }

        // Validate test cases
        ObservableList<TestCase> currentList = (currentTask == null) ? inMemoryTestCases : testCasesList;
        long sampleCount = currentList.stream().filter(TestCase::isSample).count();
        long validationCount = currentList.stream().filter(tc -> !tc.isSample()).count();

        if (sampleCount < 1) {
            errors.append("At least one sample test case is required.\n");
        }

        if (validationCount < 1) {
            errors.append("At least one validation test case is required.\n");
        }

        if (errors.length() > 0) {
            showError(errors.toString());
            return false;
        }

        return true;
    }

    private String truncateText(String text, int maxLength) {
        if (text == null) return "";
        if (text.length() <= maxLength) return text;
        return text.substring(0, maxLength) + "...";
    }

    private void showError(String message) {
        errorLabel.setText(message);
        errorLabel.setVisible(true);
    }

    private void closeDialog() {
        Stage stage = (Stage) saveButton.getScene().getWindow();
        stage.close();
    }

    // Callback method for TestCaseDialogController to add test cases to in-memory storage
    public void addInMemoryTestCase(TestCase testCase) {
        // Generate a temporary ID for in-memory test cases
        long tempId = -(inMemoryTestCases.size() + 1);
        testCase.setId(tempId);
        
        inMemoryTestCases.add(testCase);
        
        // Refresh the display
        testCasesList.clear();
        testCasesList.addAll(inMemoryTestCases);
        updateTestCaseStats();
    }

    // Callback method for TestCaseDialogController to update test cases in in-memory storage
    public void updateInMemoryTestCase(TestCase updatedTestCase) {
        for (int i = 0; i < inMemoryTestCases.size(); i++) {
            TestCase existing = inMemoryTestCases.get(i);
            if (existing.getId().equals(updatedTestCase.getId())) {
                inMemoryTestCases.set(i, updatedTestCase);
                break;
            }
        }
        
        // Refresh the display
        testCasesList.clear();
        testCasesList.addAll(inMemoryTestCases);
        updateTestCaseStats();
    }

    // Get next order for test cases
    public int getNextTestCaseOrder() {
        if (currentTask != null && currentTask.getId() != null) {
            // For existing tasks, get from database
            try {
                return testCaseDAO.getNextOrderForTask(currentTask.getId());
            } catch (Exception e) {
                // Fallback to in-memory calculation
                return getNextOrderFromMemory();
            }
        } else {
            // For new tasks, calculate from in-memory test cases
            return getNextOrderFromMemory();
        }
    }

    private int getNextOrderFromMemory() {
        ObservableList<TestCase> currentList = (currentTask == null) ? inMemoryTestCases : testCasesList;
        return currentList.stream()
                .mapToInt(TestCase::getOrderIndex)
                .max()
                .orElse(0) + 1;
    }
}