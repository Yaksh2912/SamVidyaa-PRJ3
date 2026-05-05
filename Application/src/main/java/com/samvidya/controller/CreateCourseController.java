package com.samvidya.controller;

import com.samvidya.dao.CourseDAO;
import com.samvidya.model.Course;
import com.samvidya.model.User;
import javafx.fxml.FXML;
import javafx.scene.Scene;
import javafx.scene.control.*;
import javafx.stage.Stage;

public class CreateCourseController {

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
    private CourseDAO courseDAO;
    private InstructorDashboardController parentController;

    @FXML
    private void initialize() {
        courseDAO = new CourseDAO();
        errorLabel.setVisible(false);

        // Setup subject options
        subjectComboBox.getItems().addAll("Python", "Java", "C++", "DSA", "JavaScript", "C", "Other");
        subjectComboBox.setValue("Python");

        // Setup spinner with default values
        courseTestQuestionsSpinner.setValueFactory(new SpinnerValueFactory.IntegerSpinnerValueFactory(1, 30, 5));

        // Set active by default
        activeCheckBox.setSelected(true);
    }

    public void setCurrentUser(User user) {
        this.currentUser = user;
    }

    public void setParentController(InstructorDashboardController parentController) {
        this.parentController = parentController;
    }

    @FXML
    private void handleSave() {
        if (!validateInput()) {
            return;
        }

        try {
            // Check if course code already exists
            if (courseDAO.findByCourseCode(courseCodeField.getText().trim()) != null) {
                showError("Course code already exists. Please choose a different code.");
                return;
            }

            // Create new course
            Course course = new Course();
            course.setCourseCode(courseCodeField.getText().trim().toUpperCase());
            course.setCourseName(courseNameField.getText().trim());
            course.setDescription(descriptionArea.getText().trim());
            course.setSubject(subjectComboBox.getValue());
            course.setInstructorId(currentUser.getId());
            course.setInstructorName(currentUser.getFullName());
            course.setCourseTestQuestions(courseTestQuestionsSpinner.getValue());
            course.setActive(activeCheckBox.isSelected());

            // Save to database
            courseDAO.save(course);

            // Seed default shop item for the new course
            try {
                new com.samvidya.dao.ShopDAO().seedDefaultItems(course.getId());
            } catch (Exception ex) {
                ex.printStackTrace(); // non-fatal
            }

            // Show success message
            Alert alert = new Alert(Alert.AlertType.INFORMATION);
            alert.setTitle("Success");
            alert.setHeaderText(null);
            alert.setContentText("Course created successfully!");
            alert.showAndWait();

            // Refresh parent controller and close dialog
            if (parentController != null) {
                parentController.refreshCourses();
            }
            closeDialog();

        } catch (Exception e) {
            e.printStackTrace();
            showError("Failed to create course: " + e.getMessage());
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