package com.samvidya.controller;

import com.samvidya.dao.UserDAO;
import com.samvidya.model.User;
import com.samvidya.util.BCryptUtil;
import com.samvidya.util.RememberMeStore;
import com.samvidya.util.SceneTransitionUtil;
import javafx.application.Platform;
import javafx.fxml.FXML;
import javafx.fxml.FXMLLoader;
import javafx.scene.Parent;
import javafx.scene.Scene;
import javafx.scene.control.*;
import javafx.scene.layout.StackPane;
import javafx.stage.Modality;
import javafx.stage.Screen;
import javafx.stage.Stage;
import javafx.geometry.Side;
import org.kordamp.ikonli.javafx.FontIcon;

import java.util.List;

public class LoginController {

    @FXML
    private TextField usernameField;

    @FXML
    private PasswordField passwordField;

    @FXML
    private TextField passwordTextField;

    @FXML
    private Button togglePasswordButton;

    @FXML
    private FontIcon eyeIcon;

    @FXML
    private Button loginButton;

    @FXML
    private Button registerButton;

    @FXML
    private Label errorLabel;

    @FXML
    private Button backButton;

    @FXML
    private CheckBox rememberMeCheckbox;

    @FXML
    private ProgressIndicator loadingIndicator;

    @FXML
    private StackPane rootPane;

    private String userRole;
    private UserDAO userDAO;
    private RememberMeStore rememberMeStore;
    private List<RememberMeStore.SavedLogin> savedLogins;
    private ContextMenu usernameSuggestionsMenu;

    @FXML
    private void initialize() {
        userDAO = new UserDAO();
        rememberMeStore = new RememberMeStore();
        savedLogins = rememberMeStore.load();
        usernameSuggestionsMenu = new ContextMenu();
        
        // Hide loading indicator initially
        loadingIndicator.setVisible(false);
        errorLabel.setVisible(false);
        
        // Add hover effects for login, register and back buttons
        loginButton.setOnMouseEntered(e -> loginButton.setStyle("-fx-background-color: #1251a3; -fx-text-fill: white; -fx-font-weight: bold; -fx-background-radius: 20; -fx-font-size: 16px; -fx-padding: 10 30;"));
        loginButton.setOnMouseExited(e -> loginButton.setStyle("-fx-background-color: #1976d2; -fx-text-fill: white; -fx-font-weight: bold; -fx-background-radius: 20; -fx-font-size: 16px; -fx-padding: 10 30;"));
        registerButton.setOnMouseEntered(e -> registerButton.setStyle("-fx-background-color: #388e3c; -fx-text-fill: white; -fx-font-weight: bold; -fx-background-radius: 20; -fx-font-size: 16px; -fx-padding: 10 30;"));
        registerButton.setOnMouseExited(e -> registerButton.setStyle("-fx-background-color: #4caf50; -fx-text-fill: white; -fx-font-weight: bold; -fx-background-radius: 20; -fx-font-size: 16px; -fx-padding: 10 30;"));
        backButton.setOnMouseEntered(e -> backButton.setStyle("-fx-background-color: #bdbdbd; -fx-text-fill: #222; -fx-font-weight: bold; -fx-background-radius: 20; -fx-font-size: 16px; -fx-padding: 10 30;"));
        backButton.setOnMouseExited(e -> backButton.setStyle("-fx-background-color: #e0e0e0; -fx-text-fill: #333; -fx-font-weight: bold; -fx-background-radius: 20; -fx-font-size: 16px; -fx-padding: 10 30;"));

        // Sync password fields for toggle visibility
        passwordField.textProperty().addListener((obs, ov, nv) -> {
            if (!passwordTextField.getText().equals(nv)) {
                passwordTextField.setText(nv);
            }
        });
        passwordTextField.textProperty().addListener((obs, ov, nv) -> {
            if (!passwordField.getText().equals(nv)) {
                passwordField.setText(nv);
            }
        });
        
        // Toggle password visibility
        togglePasswordButton.setOnAction(e -> {
            boolean showing = passwordTextField.isVisible();
            passwordTextField.setVisible(!showing);
            passwordTextField.setManaged(!showing);
            passwordField.setVisible(showing);
            passwordField.setManaged(showing);
            eyeIcon.setIconLiteral(showing ? "fas-eye-slash" : "fas-eye");
        });

        // Bind rootPane to scene size so it always fills the window on resize
        rootPane.sceneProperty().addListener((obs, oldScene, newScene) -> {
            if (newScene != null) {
                rootPane.prefWidthProperty().bind(newScene.widthProperty());
                rootPane.prefHeightProperty().bind(newScene.heightProperty());
            }
        });

        // Username suggestions
        usernameField.textProperty().addListener((obs, ov, nv) -> {
            if (nv == null || nv.trim().isEmpty()) {
                usernameSuggestionsMenu.hide();
                return;
            }
            List<RememberMeStore.SavedLogin> sugg = rememberMeStore.suggest(savedLogins, nv, 6);
            if (sugg.isEmpty()) {
                usernameSuggestionsMenu.hide();
                return;
            }
            usernameSuggestionsMenu.getItems().clear();
            for (RememberMeStore.SavedLogin sl : sugg) {
                MenuItem mi = new MenuItem(sl.username);
                mi.setOnAction(a -> {
                    usernameField.setText(sl.username);
                    String dec = rememberMeStore.decode(sl.password);
                    String pwd = dec == null ? "" : dec;
                    passwordField.setText(pwd);
                    passwordTextField.setText(pwd);
                    usernameSuggestionsMenu.hide();
                    if (passwordField.isVisible()) {
                        passwordField.requestFocus();
                    } else {
                        passwordTextField.requestFocus();
                    }
                });
                usernameSuggestionsMenu.getItems().add(mi);
            }
            if (!usernameSuggestionsMenu.isShowing()) {
                usernameSuggestionsMenu.show(usernameField, Side.BOTTOM, 0, 0);
            }
        });

        usernameField.focusedProperty().addListener((o, was, is) -> {
            if (!is) usernameSuggestionsMenu.hide();
        });
    }

    public void setUserRole(String role) {
        this.userRole = role;
        if (registerButton != null) {
            registerButton.setVisible("STUDENT".equals(role) || "INSTRUCTOR".equals(role));
        }
    }

    @FXML
    private void handleLogin() {
        String username = usernameField.getText().trim();
        String password = passwordField.isVisible() ? passwordField.getText() : passwordTextField.getText();

        if (username.isEmpty() || password.isEmpty()) {
            showError("Please enter both username and password");
            return;
        }

        // Show loading indicator
        loadingIndicator.setVisible(true);
        loginButton.setDisable(true);
        errorLabel.setVisible(false);

        // Run authentication in background
        new Thread(() -> {
            try {
                User user = userDAO.findByUsername(username);
                Platform.runLater(() -> {
                    if (user != null) {
                        // For combined instructor/admin login, allow both roles
                        if ("INSTRUCTOR".equals(userRole)) {
                            if (!user.getRole().equals("INSTRUCTOR") && !user.getRole().equals("ADMIN")) {
                                showError("Access denied. This login is for instructors and administrators only.");
                                loadingIndicator.setVisible(false);
                                loginButton.setDisable(false);
                                return;
                            }
                        } else if (!user.getRole().equals(userRole)) {
                            showError("Invalid role for this user");
                            loadingIndicator.setVisible(false);
                            loginButton.setDisable(false);
                            return;
                        }

                        // Handle password verification and migration
                        boolean passwordValid = false;
                        
                        if (user.isUsingPlainPassword()) {
                            // User has plain text password, verify directly
                            passwordValid = password.equals(user.getPassword());
                            
                            if (passwordValid) {
                                // Migrate to hashed password
                                String hashedPassword = BCryptUtil.hashPassword(password);
                                user.setPasswordHash(hashedPassword);
                                user.setPassword(null); // Clear plain text password
                                try {
                                    userDAO.save(user); // Update in database
                                    System.out.println("Password migrated to hash for user: " + username);
                                } catch (Exception e) {
                                    e.printStackTrace();
                                }
                            }
                        } else {
                            // User has hashed password, verify with BCrypt
                            passwordValid = BCryptUtil.verifyPassword(password, user.getPasswordHash());
                        }

                        if (!passwordValid) {
                            showError("Invalid username or password");
                            loadingIndicator.setVisible(false);
                            loginButton.setDisable(false);
                            return;
                        }

                        try {
                            // Handle remember me
                            if (rememberMeCheckbox != null && rememberMeCheckbox.isSelected()) {
                                // Save username + password
                                rememberMeStore.upsert(savedLogins, username, password);
                            } else {
                                // Do not change any existing saved password; just update lastUsed if present
                                long now = System.currentTimeMillis() / 1000L;
                                boolean found = false;
                                for (RememberMeStore.SavedLogin sl : savedLogins) {
                                    if (sl.username != null && sl.username.equalsIgnoreCase(username)) {
                                        sl.lastUsed = now;
                                        found = true;
                                        break;
                                    }
                                }
                                // If not present, add username with empty password
                                if (!found) {
                                    rememberMeStore.upsert(savedLogins, username, "");
                                }
                            }
                            rememberMeStore.save(savedLogins);
                        } catch (Exception ignore) {}

                        // Update last login
                        try {
                            userDAO.updateLastLogin(user.getId());
                        } catch (Exception e) {
                            e.printStackTrace();
                        }

                        // Navigate to dashboard
                        navigateToDashboard(user);
                    } else {
                        showError("Invalid username or password");
                        loadingIndicator.setVisible(false);
                        loginButton.setDisable(false);
                    }
                });
            } catch (Exception e) {
                Platform.runLater(() -> {
                    showError("Error during login: " + e.getMessage());
                    loadingIndicator.setVisible(false);
                    loginButton.setDisable(false);
                });
            }
        }).start();
    }

    private void navigateToDashboard(User user) {
        try {
            String fxmlFile;
            String title;

            switch (user.getRole()) {
                case "ADMIN":
                    // Admin can access instructor dashboard with higher privileges
                    fxmlFile = "/fxml/InstructorDashboard.fxml";
                    title = "SamVidya - Admin Dashboard";
                    break;
                case "INSTRUCTOR":
                    fxmlFile = "/fxml/InstructorDashboard.fxml";
                    title = "SamVidya - Instructor Dashboard";
                    break;
                case "STUDENT":
                    fxmlFile = "/fxml/StudentDashboard.fxml";
                    title = "SamVidya - Student Dashboard";
                    break;
                default:
                    showError("Unknown user role");
                    loadingIndicator.setVisible(false);
                    loginButton.setDisable(false);
                    return;
            }

            FXMLLoader loader = new FXMLLoader(getClass().getResource(fxmlFile));
            Parent root = loader.load();

            // Pass user data to the dashboard controller
            if (user.getRole().equals("INSTRUCTOR") || user.getRole().equals("ADMIN")) {
                InstructorDashboardController controller = loader.getController();
                controller.setCurrentUser(user);
            } else if (user.getRole().equals("STUDENT")) {
                StudentDashboardController controller = loader.getController();
                controller.setCurrentUser(user);
            }

            Stage stage = (Stage) loginButton.getScene().getWindow();
            
            // Set window size to full screen
            Screen screen = Screen.getPrimary();
            double screenWidth = screen.getVisualBounds().getWidth();
            double screenHeight = screen.getVisualBounds().getHeight();
            stage.setWidth(screenWidth * 1);
            stage.setHeight(screenHeight * 1);
            
            // Use smooth transition service with slide up effect
            SceneTransitionUtil.transitionTo(
                stage, 
                root,
                title,
                SceneTransitionUtil.TransitionType.SLIDE_UP
            );
            
            stage.centerOnScreen();
            
            loadingIndicator.setVisible(false);
            loginButton.setDisable(false);

        } catch (Exception e) {
            e.printStackTrace();
            showError("Failed to load dashboard: " + e.getMessage());
            loadingIndicator.setVisible(false);
            loginButton.setDisable(false);
        }
    }

    @FXML
    private void handleBack() {
        try {
            FXMLLoader loader = new FXMLLoader(getClass().getResource("/fxml/RoleSelection.fxml"));
            Parent root = loader.load();

            Stage stage = (Stage) backButton.getScene().getWindow();
            
            // Use smooth transition service with slide left effect (going back)
            SceneTransitionUtil.transitionTo(
                stage, 
                root,
                "SamVidya - Role Selection",
                SceneTransitionUtil.TransitionType.SLIDE_LEFT
            );
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    @FXML
    private void handleRegister() {
        // For student login, open student registration
        if ("STUDENT".equals(userRole)) {
            try {
                FXMLLoader loader = new FXMLLoader(getClass().getResource("/fxml/StudentRegistration.fxml"));
                Parent root = loader.load();

                Stage stage = (Stage) registerButton.getScene().getWindow();
                Scene scene = new Scene(root);
                scene.getStylesheets().add(getClass().getResource("/css/style.css").toExternalForm());
                
                stage.setTitle("SamVidya - Student Registration");
                stage.setScene(scene);
                stage.centerOnScreen();
            } catch (Exception e) {
                e.printStackTrace();
                showError("Failed to load registration page: " + e.getMessage());
            }
        } else if ("INSTRUCTOR".equals(userRole)) {
            // For instructor login, open instructor registration with registration code
            openRegistrationForm("Instructor");
        }
    }
    
    private void openRegistrationForm(String role) {
        try {
            // Load the registration FXML
            FXMLLoader loader = new FXMLLoader(getClass().getResource("/fxml/Register.fxml"));
            Parent root = loader.load();
            
            // Get the controller and set the role
            RegisterController controller = loader.getController();
            controller.setRole(role);
            
            // Create a new stage for registration
            Stage registerStage = new Stage();
            registerStage.setTitle("Register as " + role);
            registerStage.initModality(Modality.APPLICATION_MODAL);
            registerStage.initOwner(loginButton.getScene().getWindow());
            
            Scene scene = new Scene(root);
            scene.getStylesheets().add(getClass().getResource("/css/style.css").toExternalForm());
            registerStage.setScene(scene);
            
            // Set window size to 50% of screen width and full height
            Screen screen = Screen.getPrimary();
            double screenWidth = screen.getVisualBounds().getWidth();
            double screenHeight = screen.getVisualBounds().getHeight();
            registerStage.setWidth(screenWidth * 0.5);
            registerStage.setHeight(screenHeight * 1);
            registerStage.setResizable(true);
            
            registerStage.showAndWait();
        } catch (Exception e) {
            showError("Error opening registration form: " + e.getMessage());
        }
    }

    private void showError(String message) {
        errorLabel.setText(message);
        errorLabel.setVisible(true);
    }
}