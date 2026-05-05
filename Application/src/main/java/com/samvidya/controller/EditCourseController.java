package com.samvidya.controller;

import com.samvidya.dao.CourseDAO;
import com.samvidya.model.Course;
import com.samvidya.model.User;
import javafx.fxml.FXML;
import javafx.scene.control.*;
import javafx.stage.Stage;

public class EditCourseController {

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
    private Button saveButton;

    @FXML
    private Button cancelButton;

    @FXML
    private Label errorLabel;

    private User currentUser;
    private Course currentCourse;
    private CourseDAO courseDAO;
    private InstructorDashboardController parentController;

    @FXML
    private void initialize() {
        courseDAO = new CourseDAO();
        errorLabel.setVisible(false);

        // Setup subject options
        subjectComboBox.getItems().addAll("Python", "Java", "C++", "DSA", "JavaScript", "C", "Other");

        // Setup spinner with default values
        courseTestQuestionsSpinner.setValueFactory(new SpinnerValueFactory.IntegerSpinnerValueFactory(1, 30, 5));
    }

    public void setCurrentUser(User user) {
        this.currentUser = user;
    }

    public void setParentController(InstructorDashboardController parentController) {
        this.parentController = parentController;
    }

    public void setCourse(Course course) {
        this.currentCourse = course;
        populateFields();
    }

    private void populateFields() {
        if (currentCourse != null) {
            courseCodeField.setText(currentCourse.getCourseCode());
            courseNameField.setText(currentCourse.getCourseName());
            descriptionArea.setText(currentCourse.getDescription());
            subjectComboBox.setValue(currentCourse.getSubject());
            courseTestQuestionsSpinner.getValueFactory().setValue(currentCourse.getCourseTestQuestions());
            activeCheckBox.setSelected(currentCourse.isActive());
        }
    }

    @FXML
    private void handleSave() {
        if (!validateInput()) {
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

            // Refresh parent controller and close dialog
            if (parentController != null) {
                parentController.refreshCourses();
            }
            closeDialog();

        } catch (Exception e) {
            e.printStackTrace();
            showError("Failed to update course: " + e.getMessage());
        }
    }

    @FXML
    private void handleCancel() {
        closeDialog();
    }

    private boolean validateInput() {
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

    private void closeDialog() {
        Stage stage = (Stage) saveButton.getScene().getWindow();
        stage.close();
    }
}