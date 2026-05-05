package com.samvidya.controller;

import com.samvidya.dao.TestCaseDAO;
import com.samvidya.model.TestCase;
import javafx.fxml.FXML;
import javafx.scene.control.*;
import javafx.stage.Stage;

public class TestCaseDialogController {

    @FXML
    private Label titleLabel;

    @FXML
    private TextArea inputArea;

    @FXML
    private TextArea expectedOutputArea;

    @FXML
    private RadioButton sampleRadio;

    @FXML
    private RadioButton validationRadio;

    @FXML
    private Spinner<Integer> orderSpinner;

    @FXML
    private Button saveButton;

    @FXML
    private Button cancelButton;

    @FXML
    private Label errorLabel;

    private TestCase currentTestCase; // null for new test case
    private TestCaseDAO testCaseDAO;
    private Long taskId;
    private Long questionId;
    private TaskDialogController parentTaskController; // For in-memory storage callback
    private CodingQuestionDialogController parentQuestionController; // For in-memory storage callback

    @FXML
    private void initialize() {
        testCaseDAO = new TestCaseDAO();
        errorLabel.setVisible(false);

        // Setup radio button group
        ToggleGroup typeGroup = new ToggleGroup();
        sampleRadio.setToggleGroup(typeGroup);
        validationRadio.setToggleGroup(typeGroup);
        sampleRadio.setSelected(true);

        // Setup spinner
        orderSpinner.setValueFactory(new SpinnerValueFactory.IntegerSpinnerValueFactory(1, 100, 1));
    }

    public void setTaskId(Long taskId) {
        this.taskId = taskId;
    }

    public void setQuestionId(Long questionId) {
        this.questionId = questionId;
    }

    public void setParentController(TaskDialogController parentController) {
        this.parentTaskController = parentController;
    }

    public void setParentController(CodingQuestionDialogController parentController) {
        this.parentQuestionController = parentController;
    }

    public void setTestCase(TestCase testCase) {
        this.currentTestCase = testCase;
        if (testCase != null) {
            // Edit mode
            titleLabel.setText("Edit Test Case");
            saveButton.setText("Update Test Case");
            populateFields();
        } else {
            // Add mode
            titleLabel.setText("Add New Test Case");
            saveButton.setText("Create Test Case");
            // Auto-increment order for new test cases
            autoIncrementOrder();
        }
    }

    private void autoIncrementOrder() {
        try {
            int nextOrder = 1;
            
            if (taskId != null && taskId > 0) {
                // For existing tasks, get the next order from database
                nextOrder = testCaseDAO.getNextOrderForTask(taskId);
            } else if (questionId != null && questionId > 0) {
                // For existing questions, get the next order from database
                nextOrder = testCaseDAO.getNextOrderForQuestion(questionId);
            } else if (taskId != null && taskId == -1L && parentTaskController != null) {
                // For new tasks, get next order from in-memory test cases
                nextOrder = parentTaskController.getNextTestCaseOrder();
            } else if (questionId != null && questionId == -1L && parentQuestionController != null) {
                // For new questions, get next order from in-memory test cases
                nextOrder = parentQuestionController.getNextTestCaseOrder();
            }
            
            orderSpinner.getValueFactory().setValue(nextOrder);
        } catch (Exception e) {
            // If there's an error, default to order 1
            orderSpinner.getValueFactory().setValue(1);
        }
    }

    private void populateFields() {
        if (currentTestCase != null) {
            inputArea.setText(currentTestCase.getInput());
            expectedOutputArea.setText(currentTestCase.getExpectedOutput());
            
            if (currentTestCase.isSample()) {
                sampleRadio.setSelected(true);
            } else {
                validationRadio.setSelected(true);
            }
            
            orderSpinner.getValueFactory().setValue(currentTestCase.getOrderIndex());
        }
    }

    @FXML
    private void handleSave() {
        if (!validateInput()) {
            return;
        }

        try {
            TestCase testCase;
            boolean isNewTestCase = (currentTestCase == null);
            
            if (isNewTestCase) {
                // Create new test case
                testCase = new TestCase();
                
                // Handle in-memory storage for new tasks/questions
                if ((taskId != null && taskId == -1L) || (questionId != null && questionId == -1L)) {
                    // This is for a new task/question that hasn't been saved yet
                    // Store in memory via parent controller callback
                    testCase.setInput(inputArea.getText().trim());
                    testCase.setExpectedOutput(expectedOutputArea.getText().trim());
                    testCase.setSample(sampleRadio.isSelected());
                    testCase.setOrderIndex(orderSpinner.getValue());
                    
                    if (taskId != null && taskId == -1L && parentTaskController != null) {
                        parentTaskController.addInMemoryTestCase(testCase);
                    } else if (questionId != null && questionId == -1L && parentQuestionController != null) {
                        parentQuestionController.addInMemoryTestCase(testCase);
                    }
                    
                    // Show success message
                    Alert alert = new Alert(Alert.AlertType.INFORMATION);
                    alert.setTitle("Success");
                    alert.setHeaderText(null);
                    alert.setContentText("Test case added successfully!");
                    alert.showAndWait();
                    
                    // Close dialog
                    closeDialog();
                    return;
                }
                
                // Ensure exactly one of taskId or questionId is set for database storage
                if (taskId != null && taskId > 0) {
                    testCase.setTaskId(taskId);
                    testCase.setQuestionId(null);
                } else if (questionId != null && questionId > 0) {
                    testCase.setQuestionId(questionId);
                    testCase.setTaskId(null);
                } else {
                    showError("Internal error: No valid task or question ID provided");
                    return;
                }
            } else {
                // Update existing test case
                testCase = currentTestCase;
                
                // Handle in-memory updates
                if (testCase.getId() != null && testCase.getId() < 0) {
                    // This is an in-memory test case being updated
                    testCase.setInput(inputArea.getText().trim());
                    testCase.setExpectedOutput(expectedOutputArea.getText().trim());
                    testCase.setSample(sampleRadio.isSelected());
                    testCase.setOrderIndex(orderSpinner.getValue());
                    
                    if (parentTaskController != null) {
                        parentTaskController.updateInMemoryTestCase(testCase);
                    } else if (parentQuestionController != null) {
                        parentQuestionController.updateInMemoryTestCase(testCase);
                    }
                    
                    // Show success message
                    Alert alert = new Alert(Alert.AlertType.INFORMATION);
                    alert.setTitle("Success");
                    alert.setHeaderText(null);
                    alert.setContentText("Test case updated successfully!");
                    alert.showAndWait();
                    
                    // Close dialog
                    closeDialog();
                    return;
                }
            }

            // Set test case properties for database storage
            testCase.setInput(inputArea.getText().trim());
            testCase.setExpectedOutput(expectedOutputArea.getText().trim());
            testCase.setSample(sampleRadio.isSelected());
            testCase.setOrderIndex(orderSpinner.getValue());

            // Save to database
            testCaseDAO.save(testCase);

            // Show success message
            Alert alert = new Alert(Alert.AlertType.INFORMATION);
            alert.setTitle("Success");
            alert.setHeaderText(null);
            alert.setContentText(isNewTestCase ? "Test case created successfully!" : "Test case updated successfully!");
            alert.showAndWait();

            // Close dialog
            closeDialog();

        } catch (Exception e) {
            e.printStackTrace();
            showError("Failed to save test case: " + e.getMessage());
        }
    }

    @FXML
    private void handleCancel() {
        closeDialog();
    }

    private boolean validateInput() {
        StringBuilder errors = new StringBuilder();

        if (inputArea.getText().trim().isEmpty()) {
            errors.append("Input is required.\n");
        }

        if (expectedOutputArea.getText().trim().isEmpty()) {
            errors.append("Expected output is required.\n");
        }

        if (orderSpinner.getValue() < 1) {
            errors.append("Order must be at least 1.\n");
        }

        // Validate that we have exactly one parent (task or question) for database storage
        if (currentTestCase == null) {
            // For new test cases, check that exactly one ID is provided
            boolean hasTaskId = (taskId != null && taskId > 0);
            boolean hasQuestionId = (questionId != null && questionId > 0);
            boolean isTemporaryTask = (taskId != null && taskId == -1L);
            boolean isTemporaryQuestion = (questionId != null && questionId == -1L);
            
            // Allow temporary IDs for in-memory storage
            if (!isTemporaryTask && !isTemporaryQuestion && !hasTaskId && !hasQuestionId) {
                errors.append("Internal error: No parent task or question specified.\n");
            } else if (hasTaskId && hasQuestionId) {
                errors.append("Internal error: Cannot belong to both task and question.\n");
            }
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