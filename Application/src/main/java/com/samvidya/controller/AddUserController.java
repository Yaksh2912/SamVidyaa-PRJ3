package com.samvidya.controller;

import com.samvidya.dao.UserDAO;
import javafx.fxml.FXML;
import javafx.scene.control.*;
import javafx.application.Platform;
import javafx.stage.Stage;

import java.sql.SQLException;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

public class AddUserController {
    @FXML
    private TextField usernameField;
    
    @FXML
    private TextField passwordField;
    
    @FXML
    private TextField fullNameField;
    
    @FXML
    private TextField emailField;
    
    @FXML
    private ComboBox<String> roleComboBox;
    
    @FXML
    private TextField sectionField;
    
    @FXML
    private Button addButton;
    
    @FXML
    private Label messageLabel;
    
    @FXML
    private ProgressIndicator loadingIndicator;
    
    private final UserDAO userDAO;
    private final ExecutorService executorService;
    
    public AddUserController() {
        this.userDAO = new UserDAO();
        this.executorService = Executors.newCachedThreadPool();
    }
    
    @FXML
    public void initialize() {
        setupRoleComboBox();
    }
    
    private void setupRoleComboBox() {
        roleComboBox.getItems().addAll("ADMIN", "INSTRUCTOR", "STUDENT");
    }
    
    @FXML
    private void handleAdd() {
        // Show confirmation dialog
        Alert confirmAlert = new Alert(Alert.AlertType.CONFIRMATION);
        confirmAlert.setTitle("Confirm User Creation");
        confirmAlert.setHeaderText("Are you sure you want to create this user?");
        confirmAlert.setContentText("Username: " + usernameField.getText() + "\nRole: " + roleComboBox.getValue());
        
        confirmAlert.showAndWait().ifPresent(response -> {
            if (response == ButtonType.OK) {
                addUser();
            }
        });
    }
    
    private void addUser() {
        // Validate input
        if (!validateInput()) {
            return;
        }
        
        loadingIndicator.setVisible(true);
        addButton.setDisable(true);
        
        executorService.submit(() -> {
            try {
                // Add user to database
                userDAO.createUser(
                    usernameField.getText().trim(),
                    passwordField.getText().trim(),
                    fullNameField.getText().trim(),
                    emailField.getText().trim(),
                    roleComboBox.getValue(),
                    sectionField.getText().trim()
                );
                
                Platform.runLater(() -> {
                    loadingIndicator.setVisible(false);
                    addButton.setDisable(false);
                    
                    // Show success message
                    messageLabel.setText("User added successfully. Window will close in 3 seconds.");
                    messageLabel.setVisible(true);
                    
                    // Auto-close window after 3 seconds
                    new Thread(() -> {
                        try {
                            Thread.sleep(3000);
                            Platform.runLater(() -> {
                                Stage stage = (Stage) addButton.getScene().getWindow();
                                stage.close();
                            });
                        } catch (InterruptedException e) {
                            Thread.currentThread().interrupt();
                        }
                    }).start();
                });
                
            } catch (SQLException e) {
                Platform.runLater(() -> {
                    loadingIndicator.setVisible(false);
                    addButton.setDisable(false);
                    showError("Error creating user: " + e.getMessage());
                });
            }
        });
    }
    
    private boolean validateInput() {
        if (usernameField.getText().trim().isEmpty()) {
            showError("Username is required");
            return false;
        }
        
        if (passwordField.getText().trim().isEmpty()) {
            showError("Password is required");
            return false;
        }
        
        if (fullNameField.getText().trim().isEmpty()) {
            showError("Full name is required");
            return false;
        }
        
        if (emailField.getText().trim().isEmpty()) {
            showError("Email is required");
            return false;
        }
        
        if (roleComboBox.getValue() == null) {
            showError("Role is required");
            return false;
        }
        
        // Basic email validation
        String email = emailField.getText().trim();
        if (!email.contains("@") || !email.contains(".")) {
            showError("Please enter a valid email address");
            return false;
        }
        
        return true;
    }
    
    private void showError(String message) {
        Alert alert = new Alert(Alert.AlertType.ERROR);
        alert.setTitle("Validation Error");
        alert.setHeaderText(null);
        alert.setContentText(message);
        alert.showAndWait();
    }
}