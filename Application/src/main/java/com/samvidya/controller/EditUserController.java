package com.samvidya.controller;

import com.samvidya.dao.UserDAO;
import com.samvidya.model.User;
import com.samvidya.util.SceneTransitionUtil;
import javafx.fxml.FXML;
import javafx.scene.Parent;
import javafx.scene.Scene;
import javafx.scene.control.*;
import javafx.scene.layout.HBox;
import javafx.scene.layout.VBox;
import javafx.scene.layout.StackPane;
import javafx.geometry.Pos;
import javafx.application.Platform;
import javafx.stage.Stage;

import java.sql.SQLException;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

public class EditUserController {
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
    private TextField enrollmentNumberField;
    
    @FXML
    private TextField institutionField;
    
    @FXML
    private TextField sectionField;
    
    @FXML
    private Button saveButton;
    
    @FXML
    private Label messageLabel;
    
    @FXML
    private ProgressIndicator loadingIndicator;
    
    private User userToEdit;
    private String originalDisplayPassword; // Store the original displayed password
    private final UserDAO userDAO;
    private final ExecutorService executorService;
    
    public EditUserController() {
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
    
    public void setUser(User user) {
        this.userToEdit = user;
        System.out.println("DEBUG: setUser called with user: " + (user != null ? user.getUsername() : "null"));
        
        // Check if FXML fields are initialized
        System.out.println("DEBUG: Field initialization check:");
        System.out.println("  usernameField: " + (usernameField != null ? "OK" : "NULL"));
        System.out.println("  passwordField: " + (passwordField != null ? "OK" : "NULL"));
        System.out.println("  fullNameField: " + (fullNameField != null ? "OK" : "NULL"));
        System.out.println("  emailField: " + (emailField != null ? "OK" : "NULL"));
        System.out.println("  roleComboBox: " + (roleComboBox != null ? "OK" : "NULL"));
        System.out.println("  enrollmentNumberField: " + (enrollmentNumberField != null ? "OK" : "NULL"));
        System.out.println("  institutionField: " + (institutionField != null ? "OK" : "NULL"));
        
        populateFields();
    }
    
    private void populateFields() {
        if (userToEdit != null) {
            System.out.println("DEBUG: Populating fields for user: " + userToEdit.getUsername());
            
            if (usernameField != null) {
                usernameField.setText(userToEdit.getUsername());
                System.out.println("DEBUG: Username field populated: " + userToEdit.getUsername());
            } else {
                System.out.println("ERROR: usernameField is null!");
            }
            
            originalDisplayPassword = userToEdit.getDisplayPassword();
            if (passwordField != null) {
                passwordField.setText(originalDisplayPassword);
                System.out.println("DEBUG: Password field populated");
            } else {
                System.out.println("ERROR: passwordField is null!");
            }
            
            if (fullNameField != null) {
                fullNameField.setText(userToEdit.getFullName());
                System.out.println("DEBUG: Full name field populated: " + userToEdit.getFullName());
            } else {
                System.out.println("ERROR: fullNameField is null!");
            }
            
            if (emailField != null) {
                emailField.setText(userToEdit.getEmail());
                System.out.println("DEBUG: Email field populated: " + userToEdit.getEmail());
            } else {
                System.out.println("ERROR: emailField is null!");
            }
            
            if (roleComboBox != null) {
                roleComboBox.setValue(userToEdit.getRole());
                System.out.println("DEBUG: Role combo populated: " + userToEdit.getRole());
            } else {
                System.out.println("ERROR: roleComboBox is null!");
            }
            
            if (enrollmentNumberField != null) {
                enrollmentNumberField.setText(userToEdit.getEnrollmentNumber());
            } else {
                System.out.println("ERROR: enrollmentNumberField is null!");
            }
            
            if (institutionField != null) {
                institutionField.setText(userToEdit.getInstitution());
            } else {
                System.out.println("ERROR: institutionField is null!");
            }
            
            if (sectionField != null) {
                sectionField.setText(userToEdit.getSection());
            } else {
                System.out.println("ERROR: sectionField is null!");
            }
        } else {
            System.out.println("ERROR: userToEdit is null!");
        }
    }
    
    @FXML
    private void handleSave() {
        // Show confirmation overlay
        showConfirmationOverlay();
    }
    
    private void showConfirmationOverlay() {
        VBox overlay = new VBox();
        overlay.setAlignment(Pos.CENTER);
        overlay.setSpacing(24);
        overlay.setStyle("-fx-background-color: rgba(0,0,0,0.55); -fx-background-radius: 20; -fx-padding: 40;");
        overlay.setVisible(false);
        overlay.setManaged(false);
        
        Label titleLabel = new Label("Are you sure?");
        titleLabel.setStyle("-fx-font-size: 28px; -fx-text-fill: white; -fx-font-weight: bold; -fx-padding: 20;");
        
        HBox buttonBox = new HBox();
        buttonBox.setAlignment(Pos.CENTER);
        buttonBox.setSpacing(32);
        
        Button yesUpdateButton = new Button("Yes, update");
        yesUpdateButton.setStyle("-fx-background-color: #4caf50; -fx-text-fill: white; -fx-font-size: 20px; -fx-background-radius: 20; -fx-font-weight: bold; -fx-padding: 15 40;");
        yesUpdateButton.setOnAction(e -> {
            overlay.setVisible(false);
            overlay.setManaged(false);
            updateUser();
        });
        
        Button cancelButton = new Button("Cancel");
        cancelButton.setStyle("-fx-background-color: #95a5a6; -fx-text-fill: white; -fx-font-size: 20px; -fx-background-radius: 20; -fx-font-weight: bold; -fx-padding: 15 40;");
        cancelButton.setOnAction(e -> {
            overlay.setVisible(false);
            overlay.setManaged(false);
        });
        
        buttonBox.getChildren().addAll(yesUpdateButton, cancelButton);
        overlay.getChildren().addAll(titleLabel, buttonBox);
        
        Scene scene = saveButton.getScene();
        if (scene != null) {
            Parent root = scene.getRoot();
            if (root instanceof StackPane) {
                StackPane stackPane = (StackPane) root;
                stackPane.getChildren().add(overlay);
            } else {
                VBox rootVBox = (VBox) root;
                StackPane stackPane = new StackPane();
                stackPane.getChildren().addAll(rootVBox, overlay);
                scene.setRoot(stackPane);
            }
            overlay.setVisible(true);
            overlay.setManaged(true);
        }
    }
    
    private void updateUser() {
        // Validate input
        if (!validateInput()) {
            return;
        }
        
        loadingIndicator.setVisible(true);
        saveButton.setDisable(true);
        
        executorService.submit(() -> {
            try {
                System.out.println("DEBUG: Starting user update for user ID: " + userToEdit.getId());
                
                // Update user object with new values - with null safety
                String username = usernameField != null && usernameField.getText() != null ? usernameField.getText().trim() : "";
                String fullName = fullNameField != null && fullNameField.getText() != null ? fullNameField.getText().trim() : "";
                String email = emailField != null && emailField.getText() != null ? emailField.getText().trim() : "";
                String role = roleComboBox != null ? roleComboBox.getValue() : null;
                String enrollmentNumber = enrollmentNumberField != null && enrollmentNumberField.getText() != null ? enrollmentNumberField.getText().trim() : "";
                String institution = institutionField != null && institutionField.getText() != null ? institutionField.getText().trim() : "";
                String section = sectionField != null && sectionField.getText() != null ? sectionField.getText().trim() : "";
                String newPassword = passwordField != null && passwordField.getText() != null ? passwordField.getText().trim() : "";
                
                System.out.println("DEBUG: Field values - Username: " + username + ", FullName: " + fullName + ", Email: " + email + ", Role: " + role);
                
                userToEdit.setUsername(username);
                userToEdit.setFullName(fullName);
                userToEdit.setEmail(email);
                userToEdit.setRole(role);
                userToEdit.setEnrollmentNumber(enrollmentNumber);
                userToEdit.setInstitution(institution);
                userToEdit.setSection(section);
                
                // Handle password update
                System.out.println("DEBUG: Original password display: " + originalDisplayPassword);
                System.out.println("DEBUG: New password: " + newPassword);
                
                if (originalDisplayPassword != null && !newPassword.equals(originalDisplayPassword)) {
                    // Password was changed - set as new plain password
                    System.out.println("DEBUG: Password changed, setting new password");
                    userToEdit.setPassword(newPassword);
                    userToEdit.setPasswordHash(null); // Clear hash so it gets re-hashed on next login
                } else {
                    System.out.println("DEBUG: Password not changed");
                }
                // If password wasn't changed, leave it as is
                
                System.out.println("DEBUG: Calling userDAO.save()");
                // Save to database
                userDAO.save(userToEdit);
                System.out.println("DEBUG: User saved successfully");
                
                Platform.runLater(() -> {
                    loadingIndicator.setVisible(false);
                    saveButton.setDisable(false);
                    
                    // Show success message
                    messageLabel.setText("Updated Successfully. Window will close in three seconds.");
                    messageLabel.setVisible(true);
                    
                    // Auto-close window after 3 seconds
                    new Thread(() -> {
                        try {
                            Thread.sleep(3000);
                            Platform.runLater(() -> {
                                Stage stage = (Stage) saveButton.getScene().getWindow();
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
                    saveButton.setDisable(false);
                    showError("Error updating user: " + e.getMessage());
                    e.printStackTrace(); // For debugging
                });
            } catch (Exception e) {
                Platform.runLater(() -> {
                    loadingIndicator.setVisible(false);
                    saveButton.setDisable(false);
                    showError("Unexpected error: " + e.getMessage());
                    e.printStackTrace(); // For debugging
                });
            }
        });
    }
    
    private boolean validateInput() {
        // Null-safe field access
        String username = usernameField != null && usernameField.getText() != null ? usernameField.getText().trim() : "";
        String password = passwordField != null && passwordField.getText() != null ? passwordField.getText().trim() : "";
        String fullName = fullNameField != null && fullNameField.getText() != null ? fullNameField.getText().trim() : "";
        String email = emailField != null && emailField.getText() != null ? emailField.getText().trim() : "";
        String role = roleComboBox != null ? roleComboBox.getValue() : null;
        
        if (username.isEmpty() || password.isEmpty() || fullName.isEmpty() || email.isEmpty() || role == null) {
            showError("Username, password, full name, email, and role are required");
            return false;
        }
        
        // Basic email validation
        if (!email.matches("^[A-Za-z0-9+_.-]+@(.+)$")) {
            showError("Invalid email format");
            return false;
        }
        
        return true;
    }
    
    private void showError(String message) {
        messageLabel.setText(message);
        messageLabel.setStyle("-fx-text-fill: #d32f2f; -fx-font-size: 14px; -fx-font-weight: bold;");
        messageLabel.setVisible(true);
    }
    
    @FXML
    private void handleClose() {
        Stage stage = (Stage) saveButton.getScene().getWindow();
        stage.close();
    }
}