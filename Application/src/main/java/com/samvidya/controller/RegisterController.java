package com.samvidya.controller;

import com.samvidya.dao.UserDAO;
import com.samvidya.model.User;
import com.samvidya.util.BCryptUtil;
import javafx.application.Platform;
import javafx.fxml.FXML;
import javafx.scene.control.*;
import javafx.stage.Stage;

import java.sql.SQLException;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.regex.Pattern;

public class RegisterController {
    @FXML
    private TextField usernameField;
    
    @FXML
    private TextField fullNameField;
    
    @FXML
    private TextField emailField;
    
    @FXML
    private TextField registrationCodeField;
    
    @FXML
    private PasswordField passwordField;
    
    @FXML
    private Button showPasswordButton;
    
    @FXML
    private TextField passwordTextField;
    
    @FXML
    private Button showConfirmPasswordButton;
    
    @FXML
    private TextField confirmPasswordTextField;
    
    @FXML
    private PasswordField confirmPasswordField;
    
    @FXML
    private Button registerButton;
    
    @FXML
    private Label errorLabel;
    
    @FXML
    private CheckBox termsCheckbox;
    
    @FXML
    private ProgressIndicator loadingIndicator;
    
    private final UserDAO userDAO;
    private final ExecutorService executorService;
    private String selectedRole;
    private static final Pattern EMAIL_PATTERN = Pattern.compile("^[A-Za-z0-9+_.-]+@(.+)$");
    private static final Pattern PASSWORD_PATTERN = Pattern.compile("^.{8,}$");
    
    public RegisterController() {
        this.userDAO = new UserDAO();
        this.executorService = Executors.newSingleThreadExecutor();
    }
    
    public void setRole(String role) {
        this.selectedRole = role;
    }
    
    @FXML
    private void handleRegister() {
        String username = usernameField.getText().trim();
        String fullName = fullNameField.getText().trim();
        String email = emailField.getText().trim();
        String registrationCode = registrationCodeField.getText().trim();
        
        // Get password from the currently visible field
        String password = passwordField.isVisible() ? passwordField.getText() : passwordTextField.getText();
        String confirmPassword = confirmPasswordField.isVisible() ? confirmPasswordField.getText() : confirmPasswordTextField.getText();
        
        // Validate input
        if (!validateInput(username, fullName, email, registrationCode, password, confirmPassword)) {
            return;
        }
        
        // Show loading indicator
        loadingIndicator.setVisible(true);
        registerButton.setDisable(true);
        
        // Perform registration in background thread
        executorService.submit(() -> {
            try {
                // Validate registration code first
                if (!validateRegistrationCode(selectedRole, registrationCode)) {
                    Platform.runLater(() -> {
                        errorLabel.setText("Registration code is incorrect. Contact admin to get the registration code.");
                        loadingIndicator.setVisible(false);
                        registerButton.setDisable(false);
                    });
                    return;
                }
                
                // Check if username already exists
                if (userDAO.findByUsername(username) != null) {
                    Platform.runLater(() -> {
                        errorLabel.setText("Username already exists");
                        loadingIndicator.setVisible(false);
                        registerButton.setDisable(false);
                    });
                    return;
                }
                
                // Create user with role="INSTRUCTOR"
                String hashedPassword = BCryptUtil.hashPassword(password);
                User user = new User();
                user.setUsername(username);
                user.setPasswordHash(hashedPassword);
                user.setFullName(fullName);
                user.setEmail(email);
                user.setRole("INSTRUCTOR");
                
                userDAO.save(user);
                
                // Show success message and auto-close after 3 seconds
                Platform.runLater(() -> {
                    errorLabel.setText("Registration successful! This window will close in 3 seconds.");
                    errorLabel.setStyle("-fx-text-fill: #4caf50; -fx-font-size: 14px; -fx-font-weight: bold;");
                    loadingIndicator.setVisible(false);
                    registerButton.setDisable(false);
                    
                    // Auto-close window after 3 seconds
                    new Thread(() -> {
                        try {
                            Thread.sleep(3000);
                            Platform.runLater(() -> {
                                Stage stage = (Stage) registerButton.getScene().getWindow();
                                stage.close();
                            });
                        } catch (InterruptedException e) {
                            Thread.currentThread().interrupt();
                        }
                    }).start();
                });
                
            } catch (SQLException e) {
                Platform.runLater(() -> {
                    errorLabel.setText("Database error: " + e.getMessage());
                    loadingIndicator.setVisible(false);
                    registerButton.setDisable(false);
                });
            } catch (Exception e) {
                Platform.runLater(() -> {
                    errorLabel.setText("Registration failed: " + e.getMessage());
                    loadingIndicator.setVisible(false);
                    registerButton.setDisable(false);
                });
            }
        });
    }
    
    private boolean validateInput(String username, String fullName, String email, String registrationCode, String password, String confirmPassword) {
        if (username.isEmpty() || fullName.isEmpty() || email.isEmpty() || registrationCode.isEmpty() || password.isEmpty()) {
            errorLabel.setText("All fields are required");
            return false;
        }
        
        if (!EMAIL_PATTERN.matcher(email).matches()) {
            errorLabel.setText("Invalid email format");
            return false;
        }
        
        if (!PASSWORD_PATTERN.matcher(password).matches()) {
            errorLabel.setText("Password must be at least 8 characters long");
            return false;
        }
        
        if (!password.equals(confirmPassword)) {
            errorLabel.setText("Passwords do not match");
            return false;
        }
        
        if (!termsCheckbox.isSelected()) {
            errorLabel.setText("Please accept the terms and conditions");
            return false;
        }
        
        return true;
    }
    
    private boolean validateRegistrationCode(String role, String registrationCode) throws SQLException {
        if (role == null || role.trim().isEmpty()) {
            return false;
        }
        if (registrationCode == null || registrationCode.trim().isEmpty()) {
            return false;
        }
        
        String validCode = userDAO.getRegistrationCode("INSTRUCTOR");
        return validCode != null && validCode.equals(registrationCode.trim());
    }
    
    @FXML
    private void handleViewTerms() {
        // Show terms and conditions in a dialog
        Alert alert = new Alert(Alert.AlertType.INFORMATION);
        alert.setTitle("Terms and Conditions");
        alert.setHeaderText(null);
        alert.setContentText("By using SamVidya, you agree to:\n\n" +
                           "1. Provide accurate information\n" +
                           "2. Keep your account secure\n" +
                           "3. Not share your account\n" +
                           "4. Use the platform responsibly\n" +
                           "5. Respect intellectual property rights");
        alert.showAndWait();
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
}