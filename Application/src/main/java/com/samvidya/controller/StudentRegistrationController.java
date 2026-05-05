package com.samvidya.controller;

import com.samvidya.dao.CourseEmailAccessDAO;
import com.samvidya.dao.EnrollmentNumberDAO;
import com.samvidya.dao.UserDAO;
import com.samvidya.model.User;
import com.samvidya.util.BCryptUtil;
import javafx.application.Platform;
import javafx.fxml.FXML;
import javafx.fxml.FXMLLoader;
import javafx.scene.Parent;
import javafx.scene.Scene;
import javafx.scene.control.*;
import javafx.stage.Stage;

import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

public class StudentRegistrationController {

    @FXML
    private TextField enrollmentNumberField;

    @FXML
    private TextField fullNameField;

    @FXML
    private TextField emailField;

    @FXML
    private TextField usernameField;

    @FXML
    private TextField institutionField;

    @FXML
    private ComboBox<String> departmentComboBox;

    @FXML
    private TextField customDepartmentField;

    @FXML
    private ComboBox<String> sectionComboBox;

    @FXML
    private TextField customSectionField;

    @FXML
    private PasswordField passwordField;

    @FXML
    private TextField passwordTextField;

    @FXML
    private Button showPasswordButton;

    @FXML
    private PasswordField confirmPasswordField;

    @FXML
    private TextField confirmPasswordTextField;

    @FXML
    private Button showConfirmPasswordButton;

    @FXML
    private Button registerButton;

    @FXML
    private Button backToLoginButton;

    @FXML
    private Label errorLabel;

    @FXML
    private Label successLabel;

    @FXML
    private ProgressIndicator loadingIndicator;

    private UserDAO userDAO;
    private EnrollmentNumberDAO enrollmentNumberDAO;
    private CourseEmailAccessDAO emailAccessDAO;
    private ExecutorService executorService;

    @FXML
    private void initialize() {
        userDAO = new UserDAO();
        enrollmentNumberDAO = new EnrollmentNumberDAO();
        emailAccessDAO = new CourseEmailAccessDAO();
        executorService = Executors.newSingleThreadExecutor();
        
        errorLabel.setVisible(false);
        successLabel.setVisible(false);
        loadingIndicator.setVisible(false);

        // Set default institution
        institutionField.setText("SamVidya Institute");

        // Initialize Department ComboBox
        departmentComboBox.getItems().addAll("CSE", "ME", "ECom", "IT", "CE", "EE", "Custom");
        departmentComboBox.setOnAction(e -> {
            boolean isCustom = "Custom".equals(departmentComboBox.getValue());
            customDepartmentField.setVisible(isCustom);
            customDepartmentField.setManaged(isCustom);
        });

        // Initialize Section ComboBox
        sectionComboBox.getItems().addAll("I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "Custom");
        sectionComboBox.setOnAction(e -> {
            boolean isCustom = "Custom".equals(sectionComboBox.getValue());
            customSectionField.setVisible(isCustom);
            customSectionField.setManaged(isCustom);
        });
        
        // Add hover effects for buttons
        registerButton.setOnMouseEntered(e -> registerButton.setStyle("-fx-background-color: #388e3c; -fx-text-fill: white; -fx-font-weight: bold; -fx-background-radius: 20; -fx-font-size: 16px; -fx-padding: 10 30;"));
        registerButton.setOnMouseExited(e -> registerButton.setStyle("-fx-background-color: #4caf50; -fx-text-fill: white; -fx-font-weight: bold; -fx-background-radius: 20; -fx-font-size: 16px; -fx-padding: 10 30;"));
        backToLoginButton.setOnMouseEntered(e -> backToLoginButton.setStyle("-fx-background-color: #bdbdbd; -fx-text-fill: #222; -fx-font-weight: bold; -fx-background-radius: 20; -fx-font-size: 16px; -fx-padding: 10 30;"));
        backToLoginButton.setOnMouseExited(e -> backToLoginButton.setStyle("-fx-background-color: #e0e0e0; -fx-text-fill: #333; -fx-font-weight: bold; -fx-background-radius: 20; -fx-font-size: 16px; -fx-padding: 10 30;"));
    }

    @FXML
    private void handleRegister() {
        if (!validateInput()) {
            return;
        }

        // Show loading indicator
        loadingIndicator.setVisible(true);
        registerButton.setDisable(true);
        errorLabel.setVisible(false);
        successLabel.setVisible(false);

        // Perform registration in background thread
        executorService.submit(() -> {
            try {
                String enrollmentNumber = enrollmentNumberField.getText().trim();
                String email = emailField.getText().trim();
                
                // Check if enrollment number is already registered
                if (!enrollmentNumber.isEmpty()) {
                    User existingUser = userDAO.findByEnrollmentNumber(enrollmentNumber);
                    if (existingUser != null) {
                        Platform.runLater(() -> {
                            showError("This enrollment number is already registered. Please use the login option instead.");
                            loadingIndicator.setVisible(false);
                            registerButton.setDisable(false);
                        });
                        return;
                    }
                }

                // Check if enrollment number OR email is allowed for any course
                List<Long> allowedCourseIds = new ArrayList<>();
                
                // Check enrollment number access
                if (!enrollmentNumber.isEmpty()) {
                    allowedCourseIds.addAll(enrollmentNumberDAO.findCourseIdsForEnrollmentNumber(enrollmentNumber));
                }
                
                // Check email access
                if (!email.isEmpty()) {
                    allowedCourseIds.addAll(emailAccessDAO.findCourseIdsForEmail(email));
                }
                
                // Remove duplicates
                allowedCourseIds = new ArrayList<>(new java.util.HashSet<>(allowedCourseIds));
                
                if (allowedCourseIds.isEmpty()) {
                    Platform.runLater(() -> {
                        showError("This enrollment number or email is not authorized for any course. Please contact your instructor.");
                        loadingIndicator.setVisible(false);
                        registerButton.setDisable(false);
                    });
                    return;
                }

                // Check if username already exists
                User existingUsername = userDAO.findByUsername(usernameField.getText().trim());
                if (existingUsername != null) {
                    Platform.runLater(() -> {
                        showError("Username already exists. Please choose a different username.");
                        loadingIndicator.setVisible(false);
                        registerButton.setDisable(false);
                    });
                    return;
                }

                // Create new student user
                User newUser = new User();
                newUser.setEnrollmentNumber(enrollmentNumber);
                newUser.setFullName(fullNameField.getText().trim());
                newUser.setEmail(emailField.getText().trim());
                newUser.setUsername(usernameField.getText().trim());
                
                // Get password from visible field
                String password = passwordField.isVisible() ? passwordField.getText() : passwordTextField.getText();
                newUser.setPasswordHash(BCryptUtil.hashPassword(password));
                newUser.setRole("STUDENT");
                newUser.setInstitution(institutionField.getText().trim());

                // Set Section
                String dept = "Custom".equals(departmentComboBox.getValue()) ? customDepartmentField.getText().trim() : departmentComboBox.getValue();
                String sect = "Custom".equals(sectionComboBox.getValue()) ? customSectionField.getText().trim() : sectionComboBox.getValue();
                if (dept != null && sect != null) {
                    newUser.setSection(dept + " " + sect);
                }

                // Save user to database
                userDAO.save(newUser);

                Platform.runLater(() -> {
                    loadingIndicator.setVisible(false);
                    registerButton.setDisable(false);
                    
                    // Clear form
                    clearForm();
                    
                    // Show success confirmation dialog
                    Alert alert = new Alert(Alert.AlertType.INFORMATION);
                    alert.setTitle("Registration Successful");
                    alert.setHeaderText(null);
                    alert.setContentText("Registration successful! You can now login with your credentials.\n\nClick OK to proceed to login.");
                    
                    // Show dialog and wait for user response
                    alert.showAndWait().ifPresent(response -> {
                        if (response == ButtonType.OK) {
                            handleBackToLogin();
                        }
                    });
                });

            } catch (Exception e) {
                Platform.runLater(() -> {
                    e.printStackTrace();
                    showError("Registration failed: " + e.getMessage());
                    loadingIndicator.setVisible(false);
                    registerButton.setDisable(false);
                });
            }
        });
    }

    @FXML
    private void handleBackToLogin() {
        try {
            FXMLLoader loader = new FXMLLoader(getClass().getResource("/fxml/Login.fxml"));
            Parent root = loader.load();
            
            // Set the user role to STUDENT for the login controller
            LoginController loginController = loader.getController();
            loginController.setUserRole("STUDENT");

            Stage stage = (Stage) backToLoginButton.getScene().getWindow();
            Scene scene = new Scene(root);
            scene.getStylesheets().add(getClass().getResource("/css/style.css").toExternalForm());
            
            stage.setTitle("SamVidya - Student Login");
            stage.setScene(scene);
            stage.centerOnScreen();
        } catch (Exception e) {
            e.printStackTrace();
            showError("Failed to return to login: " + e.getMessage());
        }
    }

    @FXML
    private void togglePasswordVisibility() {
        if (passwordField.isVisible()) {
            // Switch to text field
            passwordTextField.setText(passwordField.getText());
            passwordField.setVisible(false);
            passwordField.setManaged(false);
            passwordTextField.setVisible(true);
            passwordTextField.setManaged(true);
            showPasswordButton.setText("🙈");
        } else {
            // Switch to password field
            passwordField.setText(passwordTextField.getText());
            passwordTextField.setVisible(false);
            passwordTextField.setManaged(false);
            passwordField.setVisible(true);
            passwordField.setManaged(true);
            showPasswordButton.setText("👁");
        }
    }

    @FXML
    private void toggleConfirmPasswordVisibility() {
        if (confirmPasswordField.isVisible()) {
            // Switch to text field
            confirmPasswordTextField.setText(confirmPasswordField.getText());
            confirmPasswordField.setVisible(false);
            confirmPasswordField.setManaged(false);
            confirmPasswordTextField.setVisible(true);
            confirmPasswordTextField.setManaged(true);
            showConfirmPasswordButton.setText("🙈");
        } else {
            // Switch to password field
            confirmPasswordField.setText(confirmPasswordTextField.getText());
            confirmPasswordTextField.setVisible(false);
            confirmPasswordTextField.setManaged(false);
            confirmPasswordField.setVisible(true);
            confirmPasswordField.setManaged(true);
            showConfirmPasswordButton.setText("👁");
        }
    }

    private boolean validateInput() {
        StringBuilder errors = new StringBuilder();

        if (enrollmentNumberField.getText().trim().isEmpty()) {
            errors.append("Enrollment number is required.\n");
        }

        if (fullNameField.getText().trim().isEmpty()) {
            errors.append("Full name is required.\n");
        }

        if (emailField.getText().trim().isEmpty()) {
            errors.append("Email is required.\n");
        } else if (!isValidEmail(emailField.getText().trim())) {
            errors.append("Please enter a valid email address.\n");
        }

        if (usernameField.getText().trim().isEmpty()) {
            errors.append("Username is required.\n");
        } else if (usernameField.getText().trim().length() < 3) {
            errors.append("Username must be at least 3 characters long.\n");
        }

        String password = passwordField.isVisible() ? passwordField.getText() : passwordTextField.getText();
        String confirmPassword = confirmPasswordField.isVisible() ? confirmPasswordField.getText() : confirmPasswordTextField.getText();

        if (password.isEmpty()) {
            errors.append("Password is required.\n");
        } else if (password.length() < 6) {
            errors.append("Password must be at least 6 characters long.\n");
        }

        if (!password.equals(confirmPassword)) {
            errors.append("Passwords do not match.\n");
        }

        if (institutionField.getText().trim().isEmpty()) {
            errors.append("Institution is required.\n");
        }

        if (departmentComboBox.getValue() == null) {
            errors.append("Department is required.\n");
        } else if ("Custom".equals(departmentComboBox.getValue()) && customDepartmentField.getText().trim().isEmpty()) {
            errors.append("Please specify your custom department.\n");
        }

        if (sectionComboBox.getValue() == null) {
            errors.append("Section/Semester is required.\n");
        } else if ("Custom".equals(sectionComboBox.getValue()) && customSectionField.getText().trim().isEmpty()) {
            errors.append("Please specify your custom section/semester.\n");
        }

        if (errors.length() > 0) {
            showError(errors.toString());
            return false;
        }

        return true;
    }

    private boolean isValidEmail(String email) {
        return email.contains("@") && email.contains(".");
    }

    private void clearForm() {
        enrollmentNumberField.clear();
        fullNameField.clear();
        emailField.clear();
        usernameField.clear();
        passwordField.clear();
        passwordTextField.clear();
        confirmPasswordField.clear();
        confirmPasswordTextField.clear();
        institutionField.setText("SamVidya Institute");
        departmentComboBox.getSelectionModel().clearSelection();
        customDepartmentField.clear();
        customDepartmentField.setVisible(false);
        customDepartmentField.setManaged(false);
        sectionComboBox.getSelectionModel().clearSelection();
        customSectionField.clear();
        customSectionField.setVisible(false);
        customSectionField.setManaged(false);
    }

    private void showError(String message) {
        errorLabel.setText(message);
        errorLabel.setVisible(true);
        successLabel.setVisible(false);
    }

    private void showSuccess(String message) {
        successLabel.setText(message);
        successLabel.setVisible(true);
        errorLabel.setVisible(false);
    }
}