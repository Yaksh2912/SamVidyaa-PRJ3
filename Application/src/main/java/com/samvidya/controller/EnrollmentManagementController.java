package com.samvidya.controller;

import com.samvidya.dao.EnrollmentNumberDAO;
import com.samvidya.model.Course;
import com.samvidya.model.EnrollmentNumber;
import javafx.collections.FXCollections;
import javafx.collections.ObservableList;
import javafx.fxml.FXML;
import javafx.scene.control.*;
import javafx.stage.Stage;

import java.util.List;
import java.util.Optional;

public class EnrollmentManagementController {

    @FXML
    private Label courseInfoLabel;

    @FXML
    private TableView<EnrollmentNumber> enrollmentTable;

    @FXML
    private TableColumn<EnrollmentNumber, String> patternColumn;

    @FXML
    private TableColumn<EnrollmentNumber, String> typeColumn;

    @FXML
    private TableColumn<EnrollmentNumber, String> rangeColumn;

    @FXML
    private TextField enrollmentPatternField;

    @FXML
    private Button addEnrollmentButton;

    @FXML
    private Button deleteEnrollmentButton;

    @FXML
    private Button closeButton;

    @FXML
    private Label errorLabel;

    @FXML
    private Label instructionsLabel;

    private Course currentCourse;
    private EnrollmentNumberDAO enrollmentNumberDAO;
    private ObservableList<EnrollmentNumber> enrollmentList;

    @FXML
    private void initialize() {
        enrollmentNumberDAO = new EnrollmentNumberDAO();
        enrollmentList = FXCollections.observableArrayList();
        errorLabel.setVisible(false);

        // Setup table columns
        patternColumn.setCellValueFactory(cellData -> 
            new javafx.beans.property.SimpleStringProperty(cellData.getValue().getEnrollmentPattern()));
        typeColumn.setCellValueFactory(cellData -> 
            new javafx.beans.property.SimpleStringProperty(cellData.getValue().getPatternType()));
        rangeColumn.setCellValueFactory(cellData -> {
            EnrollmentNumber en = cellData.getValue();
            if ("RANGE".equals(en.getPatternType())) {
                return new javafx.beans.property.SimpleStringProperty(en.getStartNumber() + " to " + en.getEndNumber());
            } else {
                return new javafx.beans.property.SimpleStringProperty("Single Number");
            }
        });

        enrollmentTable.setItems(enrollmentList);

        // Setup table selection listener
        enrollmentTable.getSelectionModel().selectedItemProperty().addListener((obs, oldSelection, newSelection) -> {
            deleteEnrollmentButton.setDisable(newSelection == null);
        });

        // Initially disable delete button
        deleteEnrollmentButton.setDisable(true);

        // Set instructions
        instructionsLabel.setText("Enter enrollment numbers in these formats:\n" +
                "• Single number: 230409\n" +
                "• Range: 210000-210100 (includes all numbers from 210000 to 210100)");
    }

    public void setCourse(Course course) {
        this.currentCourse = course;
        courseInfoLabel.setText("Enrollment Management - " + course.getCourseName());
        loadEnrollmentNumbers();
    }

    private void loadEnrollmentNumbers() {
        try {
            List<String> enrollmentNumbers = enrollmentNumberDAO.findEnrollmentNumbersByCourseId(currentCourse.getId());
            enrollmentList.clear();
            
            // Convert strings to EnrollmentNumber objects for display
            for (String enrollmentNumber : enrollmentNumbers) {
                EnrollmentNumber en = new EnrollmentNumber();
                en.setEnrollmentPattern(enrollmentNumber);
                en.setPatternType("SINGLE");
                enrollmentList.add(en);
            }
            
            hideError(); // Clear any previous error messages
        } catch (Exception e) {
            e.printStackTrace();
            showError("Failed to load enrollment numbers: " + e.getMessage());
        }
    }

    @FXML
    private void handleAddEnrollment() {
        String pattern = enrollmentPatternField.getText().trim();
        if (pattern.isEmpty()) {
            showError("Please enter an enrollment number");
            return;
        }

        try {
            // Add the enrollment number directly
            enrollmentNumberDAO.addEnrollmentNumber(pattern, currentCourse.getId());

            // Refresh the list
            loadEnrollmentNumbers();

            // Clear the input field
            enrollmentPatternField.clear();
            
            // Hide any error messages
            hideError();

            // Show success message
            Alert alert = new Alert(Alert.AlertType.INFORMATION);
            alert.setTitle("Success");
            alert.setHeaderText(null);
            alert.setContentText("Enrollment number added successfully!");
            alert.showAndWait();

        } catch (Exception e) {
            e.printStackTrace();
            showError("Failed to add enrollment number: " + e.getMessage());
        }
    }

    @FXML
    private void handleDeleteEnrollment() {
        EnrollmentNumber selectedEnrollment = enrollmentTable.getSelectionModel().getSelectedItem();
        if (selectedEnrollment == null) {
            showError("Please select an enrollment number to delete");
            return;
        }

        Alert confirmAlert = new Alert(Alert.AlertType.CONFIRMATION);
        confirmAlert.setTitle("Confirm Delete");
        confirmAlert.setHeaderText("Delete Enrollment Number");
        confirmAlert.setContentText("Are you sure you want to delete this enrollment number?");

        Optional<ButtonType> result = confirmAlert.showAndWait();
        if (result.isPresent() && result.get() == ButtonType.OK) {
            try {
                enrollmentNumberDAO.removeEnrollmentNumber(selectedEnrollment.getEnrollmentPattern(), currentCourse.getId());
                loadEnrollmentNumbers(); // Refresh the table

                Alert successAlert = new Alert(Alert.AlertType.INFORMATION);
                successAlert.setTitle("Success");
                successAlert.setHeaderText(null);
                successAlert.setContentText("Enrollment number deleted successfully!");
                successAlert.showAndWait();

            } catch (Exception e) {
                e.printStackTrace();
                showError("Failed to delete enrollment number: " + e.getMessage());
            }
        }
    }

    @FXML
    private void handleClose() {
        Stage stage = (Stage) closeButton.getScene().getWindow();
        stage.close();
    }

    private boolean isValidPattern(String pattern) {
        if (pattern.contains("-")) {
            // Range pattern
            String[] parts = pattern.split("-");
            if (parts.length != 2) {
                return false;
            }
            try {
                long start = Long.parseLong(parts[0].trim());
                long end = Long.parseLong(parts[1].trim());
                return start < end;
            } catch (NumberFormatException e) {
                return false;
            }
        } else {
            // Single number pattern
            try {
                Long.parseLong(pattern);
                return true;
            } catch (NumberFormatException e) {
                return false;
            }
        }
    }

    private void showError(String message) {
        errorLabel.setText(message);
        errorLabel.setVisible(true);
    }

    private void hideError() {
        errorLabel.setVisible(false);
    }
}