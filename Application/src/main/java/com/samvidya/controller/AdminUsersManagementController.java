package com.samvidya.controller;

import com.samvidya.dao.UserDAO;
import com.samvidya.model.User;
import com.samvidya.service.UserSyncService;
import javafx.collections.FXCollections;
import javafx.collections.ObservableList;
import javafx.collections.transformation.FilteredList;
import javafx.collections.transformation.SortedList;
import javafx.fxml.FXML;
import javafx.fxml.FXMLLoader;
import javafx.scene.Parent;
import javafx.scene.Scene;
import javafx.scene.control.*;
import javafx.scene.control.cell.PropertyValueFactory;
import javafx.scene.layout.HBox;
import javafx.scene.layout.VBox;
import javafx.stage.Stage;
import javafx.util.Callback;
import javafx.beans.property.SimpleStringProperty;
import javafx.stage.Screen;
import javafx.application.Platform;

import java.io.IOException;
import java.sql.SQLException;
import java.util.List;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

public class AdminUsersManagementController {
    @FXML
    private TableView<User> usersTable;
    
    @FXML
    private TableColumn<User, Integer> serialNoColumn;
    
    @FXML
    private TableColumn<User, String> usernameColumn;
    
    @FXML
    private TableColumn<User, String> passwordColumn;
    
    @FXML
    private TableColumn<User, String> fullNameColumn;
    
    @FXML
    private TableColumn<User, String> emailColumn;
    
    @FXML
    private TableColumn<User, String> sectionColumn;
    
    @FXML
    private TableColumn<User, String> roleColumn;
    
    @FXML
    private TableColumn<User, Void> actionsColumn;
    
    @FXML
    private TextField searchField;
    
    @FXML
    private ComboBox<String> sortByComboBox;
    
    @FXML
    private ComboBox<String> sortOrderComboBox;
    
    @FXML
    private ComboBox<String> filterByComboBox;
    
    @FXML
    private Button addUserButton;
    
    @FXML
    private Button refreshButton;

    @FXML
    private Button syncUsersButton;
    
    @FXML
    private ProgressIndicator loadingIndicator;
    
    // User Type Toggle
    @FXML
    private ToggleButton userTypeToggle;
    
    @FXML
    private Label userCountLabel;
    
    @FXML
    private VBox registrationCodesSection;
    
    @FXML
    private Label titleLabel;
    
    // Registration Code Fields
    @FXML
    private TextField instructorCodeField;
    
    @FXML
    private TextField studentCodeField;
    
    @FXML
    private Button editInstructorCodeButton;
    
    @FXML
    private Button editStudentCodeButton;
    
    @FXML
    private HBox instructorCodeActionButtons;
    
    @FXML
    private HBox studentCodeActionButtons;
    
    @FXML
    private Button saveInstructorCodeButton;
    
    @FXML
    private Button saveStudentCodeButton;
    
    @FXML
    private Button cancelInstructorCodeButton;
    
    @FXML
    private Button cancelStudentCodeButton;
    
    private final UserDAO userDAO;
    private final ObservableList<User> users;
    private final FilteredList<User> filteredUsers;
    private final ExecutorService executorService;
    private final UserSyncService userSyncService;
    
    // Store original values for cancel operations
    private String originalInstructorCode;
    private String originalStudentCode;
    
    // Student-only mode flag
    private boolean studentOnlyMode = false;
    
    public AdminUsersManagementController() {
        this.userDAO = new UserDAO();
        this.users = FXCollections.observableArrayList();
        this.filteredUsers = new FilteredList<>(users, s -> true);
        this.executorService = Executors.newCachedThreadPool();
        this.userSyncService = new UserSyncService();
    }
    
    public void setStudentOnlyMode(boolean studentOnlyMode) {
        this.studentOnlyMode = studentOnlyMode;
        if (studentOnlyMode) {
            configureStudentOnlyMode();
        }
    }
    
    private void configureStudentOnlyMode() {
        // Hide registration codes section
        if (registrationCodesSection != null) {
            registrationCodesSection.setVisible(false);
            registrationCodesSection.setManaged(false);
        }
        
        // Hide add user button
        if (addUserButton != null) {
            addUserButton.setVisible(false);
            addUserButton.setManaged(false);
        }
        
        // Force toggle to students view and hide toggle
        if (userTypeToggle != null) {
            userTypeToggle.setSelected(false); // Students view
            userTypeToggle.setVisible(false);
            userTypeToggle.setManaged(false);
            handleUserTypeToggle(); // Apply the filter
        }
        
        // Update title label
        if (titleLabel != null) {
            titleLabel.setText("SamVidya - Students");
        }
    }
    
    @FXML
    public void initialize() {
        setupTableColumns();
        setupFilteringAndSorting();
        setupSearchField();
        setupRegistrationCodeValidation();
        loadRegistrationCodes();
        loadUsers();
    }
    
    private void setupTableColumns() {
        // UI-only S. No. column showing 1-based row index
        serialNoColumn.setSortable(false);
        serialNoColumn.setCellFactory(col -> new TableCell<User, Integer>() {
            @Override
            protected void updateItem(Integer item, boolean empty) {
                super.updateItem(item, empty);
                if (empty) {
                    setText(null);
                } else {
                    setText(String.valueOf(getIndex() + 1));
                }
            }
        });
        
        usernameColumn.setCellValueFactory(new PropertyValueFactory<>("username"));
        
        // Password column shows hash if hashed, plain if not hashed
        passwordColumn.setCellValueFactory(cellData -> 
            new SimpleStringProperty(cellData.getValue().getDisplayPassword()));
        
        fullNameColumn.setCellValueFactory(new PropertyValueFactory<>("fullName"));
        emailColumn.setCellValueFactory(new PropertyValueFactory<>("email"));
        sectionColumn.setCellValueFactory(new PropertyValueFactory<>("section"));
        roleColumn.setCellValueFactory(new PropertyValueFactory<>("role"));
        
        // Setup action buttons column
        actionsColumn.setCellFactory(createActionButtons());
        
        // Set up table with filtered data
        usersTable.setItems(filteredUsers);
    }
    
    private void setupFilteringAndSorting() {
        // Setup sort options
        sortByComboBox.getItems().addAll("Username", "Full Name", "Email", "Role");
        sortOrderComboBox.getItems().addAll("Ascending", "Descending");
        
        // Setup filter options
        filterByComboBox.getItems().addAll("Username", "Full Name", "Email", "Role");
        
        // Set default selections
        sortByComboBox.setValue("Username");
        filterByComboBox.setValue("Username");
        sortOrderComboBox.setValue("Ascending");
        
        // Setup sorting
        sortByComboBox.setOnAction(e -> updateSorting());
        sortOrderComboBox.setOnAction(e -> updateSorting());
    }
    
    private void setupSearchField() {
        searchField.textProperty().addListener((observable, oldValue, newValue) -> {
            updateFiltering();
        });
        
        // Also update filtering when filter combo box changes
        filterByComboBox.setOnAction(e -> updateFiltering());
    }
    
    private void updateFiltering() {
        String searchText = searchField.getText();
        String selectedField = filterByComboBox.getValue();
        boolean showInstructorsAdmins = userTypeToggle.isSelected();
        
        filteredUsers.setPredicate(user -> {
            // First filter by user type (toggle)
            boolean matchesUserType;
            if (showInstructorsAdmins) {
                matchesUserType = "INSTRUCTOR".equals(user.getRole()) || "ADMIN".equals(user.getRole());
            } else {
                matchesUserType = "STUDENT".equals(user.getRole());
            }
            
            if (!matchesUserType) {
                return false;
            }
            
            // Then filter by search text
            if (searchText == null || searchText.isEmpty()) {
                return true;
            }
            
            String lowerCaseFilter = searchText.toLowerCase();
            switch (selectedField) {
                case "Username":
                    return user.getUsername().toLowerCase().contains(lowerCaseFilter);
                case "Full Name":
                    return user.getFullName().toLowerCase().contains(lowerCaseFilter);
                case "Email":
                    return user.getEmail().toLowerCase().contains(lowerCaseFilter);
                case "Role":
                    return user.getRole().toLowerCase().contains(lowerCaseFilter);
                default:
                    return true;
            }
        });
        
        updateUserCountLabel();
    }
    
    private void setupRegistrationCodeValidation() {
        // Add text change listeners to truncate to 6 characters
        instructorCodeField.textProperty().addListener((observable, oldValue, newValue) -> {
            if (newValue != null && newValue.length() > 6) {
                instructorCodeField.setText(newValue.substring(0, 6));
            }
        });
        
        studentCodeField.textProperty().addListener((observable, oldValue, newValue) -> {
            if (newValue != null && newValue.length() > 6) {
                studentCodeField.setText(newValue.substring(0, 6));
            }
        });
    }
    
    private void updateSorting() {
        String sortBy = sortByComboBox.getValue();
        String sortOrder = sortOrderComboBox.getValue();
        
        if (sortBy != null && sortOrder != null) {
            SortedList<User> sortedUsers = new SortedList<>(filteredUsers);
            sortedUsers.comparatorProperty().bind(usersTable.comparatorProperty());
            usersTable.setItems(sortedUsers);
            
            // Apply sorting based on selection
            switch (sortBy) {
                case "Username":
                    usersTable.getSortOrder().clear();
                    usersTable.getSortOrder().add(usernameColumn);
                    break;
                case "Full Name":
                    usersTable.getSortOrder().clear();
                    usersTable.getSortOrder().add(fullNameColumn);
                    break;
                case "Email":
                    usersTable.getSortOrder().clear();
                    usersTable.getSortOrder().add(emailColumn);
                    break;
                case "Role":
                    usersTable.getSortOrder().clear();
                    usersTable.getSortOrder().add(roleColumn);
                    break;
            }
            
            // Set sort order
            if ("Descending".equals(sortOrder)) {
                usersTable.getSortOrder().forEach(col -> col.setSortType(TableColumn.SortType.DESCENDING));
            } else {
                usersTable.getSortOrder().forEach(col -> col.setSortType(TableColumn.SortType.ASCENDING));
            }
        }
    }
    
    private Callback<TableColumn<User, Void>, TableCell<User, Void>> createActionButtons() {
        return new Callback<TableColumn<User, Void>, TableCell<User, Void>>() {
            @Override
            public TableCell<User, Void> call(TableColumn<User, Void> param) {
                return new TableCell<User, Void>() {
                    private final Button editButton = new Button("Edit");
                    private final Button deleteButton = new Button("Delete");
                    private final Button resetPasswordButton = new Button("Reset Password");
                    private final HBox buttons = new HBox(5);
                    
                    {
                        editButton.setStyle("-fx-background-radius: 5; -fx-padding: 5 8; -fx-min-width: 50; -fx-background-color: #2196F3; -fx-text-fill: white;");
                        deleteButton.setStyle("-fx-background-radius: 5; -fx-padding: 5 8; -fx-min-width: 50; -fx-background-color: #f44336; -fx-text-fill: white;");
                        resetPasswordButton.setStyle("-fx-background-radius: 5; -fx-padding: 5 8; -fx-min-width: 80; -fx-background-color: #ff9800; -fx-text-fill: white;");
                        
                        editButton.setOnAction(e -> {
                            User user = getTableView().getItems().get(getIndex());
                            handleEditUser(user);
                        });
                        
                        deleteButton.setOnAction(e -> {
                            User user = getTableView().getItems().get(getIndex());
                            handleDeleteUser(user);
                        });
                        
                        resetPasswordButton.setOnAction(e -> {
                            User user = getTableView().getItems().get(getIndex());
                            handleResetPassword(user);
                        });
                    }
                    
                    @Override
                    protected void updateItem(Void item, boolean empty) {
                        super.updateItem(item, empty);
                        buttons.getChildren().clear();
                        
                        if (empty) {
                            setGraphic(null);
                        } else if (studentOnlyMode) {
                            // In student-only mode (instructor view), only show reset password for students
                            User user = getTableView().getItems().get(getIndex());
                            if (user != null && "STUDENT".equals(user.getRole())) {
                                buttons.getChildren().add(resetPasswordButton);
                                setGraphic(buttons);
                            } else {
                                setGraphic(null);
                            }
                        } else {
                            // In admin mode, show all buttons but reset password only for students
                            User user = getTableView().getItems().get(getIndex());
                            if (user != null) {
                                buttons.getChildren().addAll(editButton, deleteButton);
                                if ("STUDENT".equals(user.getRole())) {
                                    buttons.getChildren().add(resetPasswordButton);
                                }
                                setGraphic(buttons);
                            } else {
                                setGraphic(null);
                            }
                        }
                    }
                };
            }
        };
    }
    
    private void loadUsers() {
        loadingIndicator.setVisible(true);
        executorService.submit(() -> {
            try {
                List<User> userList = userDAO.findAll();
                Platform.runLater(() -> {
                    users.clear();
                    users.addAll(userList);
                    loadingIndicator.setVisible(false);
                    updateFiltering(); // This will also update the count
                });
            } catch (SQLException e) {
                Platform.runLater(() -> {
                    loadingIndicator.setVisible(false);
                    showError("Error loading users: " + e.getMessage());
                });
            }
        });
    }
    
    @FXML
    private void handleUserTypeToggle() {
        if (userTypeToggle.isSelected()) {
            userTypeToggle.setText("Instructors/Admins");
            userTypeToggle.setStyle("-fx-background-color: #2196F3; -fx-text-fill: white; -fx-font-weight: bold; -fx-background-radius: 20; -fx-padding: 8 16; -fx-min-width: 150;");
        } else {
            userTypeToggle.setText("Students");
            userTypeToggle.setStyle("-fx-background-color: #4caf50; -fx-text-fill: white; -fx-font-weight: bold; -fx-background-radius: 20; -fx-padding: 8 16; -fx-min-width: 150;");
        }
        updateFiltering();
    }
    
    private void updateUserCountLabel() {
        if (filteredUsers != null) {
            long count = filteredUsers.stream().count();
            String userType = userTypeToggle.isSelected() ? "instructors/admins" : "students";
            userCountLabel.setText(count + " " + userType);
        }
    }
    
    private void loadRegistrationCodes() {
        executorService.submit(() -> {
            try {
                String instructorCode = userDAO.getRegistrationCode("INSTRUCTOR");
                String studentCode = userDAO.getRegistrationCode("STUDENT");
                
                Platform.runLater(() -> {
                    instructorCodeField.setText(instructorCode != null ? instructorCode : "");
                    studentCodeField.setText(studentCode != null ? studentCode : "");
                    originalInstructorCode = instructorCode;
                    originalStudentCode = studentCode;
                });
            } catch (SQLException e) {
                Platform.runLater(() -> {
                    showError("Error loading registration codes: " + e.getMessage());
                });
            }
        });
    }
    
    // Registration Code Edit Handlers
    @FXML
    private void handleEditInstructorCode() {
        instructorCodeField.setEditable(true);
        editInstructorCodeButton.setVisible(false);
        editInstructorCodeButton.setManaged(false);
        instructorCodeActionButtons.setVisible(true);
        instructorCodeActionButtons.setManaged(true);
        instructorCodeField.requestFocus();
        instructorCodeField.selectAll();
    }
    
    @FXML
    private void handleSaveInstructorCode() {
        String newCode = instructorCodeField.getText().trim();
        if (newCode.isEmpty()) {
            showError("Registration code cannot be empty");
            return;
        }
        if (newCode.length() != 6) {
            showError("Registration code must be exactly 6 characters long");
            return;
        }
        
        executorService.submit(() -> {
            try {
                userDAO.updateRegistrationCode("INSTRUCTOR", newCode);
                Platform.runLater(() -> {
                    originalInstructorCode = newCode;
                    instructorCodeField.setEditable(false);
                    editInstructorCodeButton.setVisible(true);
                    editInstructorCodeButton.setManaged(true);
                    instructorCodeActionButtons.setVisible(false);
                    instructorCodeActionButtons.setManaged(false);
                    showSuccess("Instructor registration code updated successfully");
                });
            } catch (SQLException e) {
                Platform.runLater(() -> {
                    showError("Error updating instructor registration code: " + e.getMessage());
                });
            }
        });
    }
    
    @FXML
    private void handleCancelInstructorCode() {
        instructorCodeField.setText(originalInstructorCode);
        instructorCodeField.setEditable(false);
        editInstructorCodeButton.setVisible(true);
        editInstructorCodeButton.setManaged(true);
        instructorCodeActionButtons.setVisible(false);
        instructorCodeActionButtons.setManaged(false);
    }
    
    @FXML
    private void handleEditStudentCode() {
        studentCodeField.setEditable(true);
        editStudentCodeButton.setVisible(false);
        editStudentCodeButton.setManaged(false);
        studentCodeActionButtons.setVisible(true);
        studentCodeActionButtons.setManaged(true);
        studentCodeField.requestFocus();
        studentCodeField.selectAll();
    }
    
    @FXML
    private void handleSaveStudentCode() {
        String newCode = studentCodeField.getText().trim();
        if (newCode.isEmpty()) {
            showError("Registration code cannot be empty");
            return;
        }
        if (newCode.length() != 6) {
            showError("Registration code must be exactly 6 characters long");
            return;
        }
        
        executorService.submit(() -> {
            try {
                userDAO.updateRegistrationCode("STUDENT", newCode);
                Platform.runLater(() -> {
                    originalStudentCode = newCode;
                    studentCodeField.setEditable(false);
                    editStudentCodeButton.setVisible(true);
                    editStudentCodeButton.setManaged(true);
                    studentCodeActionButtons.setVisible(false);
                    studentCodeActionButtons.setManaged(false);
                    showSuccess("Student registration code updated successfully");
                });
            } catch (SQLException e) {
                Platform.runLater(() -> {
                    showError("Error updating student registration code: " + e.getMessage());
                });
            }
        });
    }
    
    @FXML
    private void handleCancelStudentCode() {
        studentCodeField.setText(originalStudentCode);
        studentCodeField.setEditable(false);
        editStudentCodeButton.setVisible(true);
        editStudentCodeButton.setManaged(true);
        studentCodeActionButtons.setVisible(false);
        studentCodeActionButtons.setManaged(false);
    }
    
    @FXML
    private void handleSyncUsers() {
        syncUsersButton.setDisable(true);
        syncUsersButton.setText("Syncing…");

        executorService.submit(() -> {
            try {
                UserSyncService.SyncResult result = userSyncService.syncAllUsers();
                Platform.runLater(() -> {
                    syncUsersButton.setDisable(false);
                    syncUsersButton.setText("☁ Sync Users");
                    showSuccess("Users synced to MongoDB successfully!\n\n" +
                            "Trusted Users (Admins/Instructors): " + result.trustedCount + "\n" +
                            "Students: " + result.studentCount);
                });
            } catch (Exception e) {
                Platform.runLater(() -> {
                    syncUsersButton.setDisable(false);
                    syncUsersButton.setText("☁ Sync Users");
                    showError("Sync failed: " + e.getMessage());
                });
            }
        });
    }

    @FXML
    private void handleRefresh() {
        loadUsers();
        loadRegistrationCodes();
    }
    
    @FXML
    private void handleAddUser() {
        try {
            FXMLLoader loader = new FXMLLoader(getClass().getResource("/fxml/AddUser.fxml"));
            Parent root = loader.load();
            
            Stage stage = new Stage();
            Scene scene = new Scene(root);
            scene.getStylesheets().add(getClass().getResource("/css/style.css").toExternalForm());
            stage.setScene(scene);
            stage.setTitle("Add New User");
            
            // Set window size to 100% height and 40% width
            Screen screen = Screen.getPrimary();
            double screenHeight = screen.getVisualBounds().getHeight();
            double screenWidth = screen.getVisualBounds().getWidth();
            stage.setWidth(screenWidth * 0.4);
            stage.setHeight(screenHeight);
            
            stage.show();
            stage.centerOnScreen();
            
            // Refresh table when add window is closed
            stage.setOnHidden(e -> loadUsers());
        } catch (IOException e) {
            showError("Error opening add user window: " + e.getMessage());
        }
    }
    
    private void handleEditUser(User user) {
        try {
            FXMLLoader loader = new FXMLLoader(getClass().getResource("/fxml/EditUser.fxml"));
            Parent root = loader.load();
            
            // Set user data in EditUserController
            EditUserController controller = loader.getController();
            controller.setUser(user);
            
            Stage stage = new Stage();
            Scene scene = new Scene(root);
            scene.getStylesheets().add(getClass().getResource("/css/style.css").toExternalForm());
            stage.setScene(scene);
            stage.setTitle("Edit User: " + user.getUsername());
            
            // Set window size to 100% height and 40% width
            Screen screen = Screen.getPrimary();
            double screenHeight = screen.getVisualBounds().getHeight();
            double screenWidth = screen.getVisualBounds().getWidth();
            stage.setWidth(screenWidth * 0.4);
            stage.setHeight(screenHeight);
            
            stage.show();
            stage.centerOnScreen();
            
            // Refresh table when edit window is closed
            stage.setOnHidden(e -> loadUsers());
        } catch (IOException e) {
            showError("Error opening edit window: " + e.getMessage());
        }
    }
    
    private void handleDeleteUser(User user) {
        Alert alert = new Alert(Alert.AlertType.CONFIRMATION);
        alert.setTitle("Delete User");
        alert.setHeaderText("Are you sure you want to delete this user?");
        alert.setContentText("Username: " + user.getUsername() + "\nFull Name: " + user.getFullName());
        
        alert.showAndWait().ifPresent(response -> {
            if (response == ButtonType.OK) {
                executorService.submit(() -> {
                    try {
                        userDAO.delete(user.getId());
                        Platform.runLater(() -> {
                            users.remove(user);
                            showSuccess("User deleted successfully");
                        });
                    } catch (SQLException e) {
                        Platform.runLater(() -> {
                            showError("Error deleting user: " + e.getMessage());
                        });
                    }
                });
            }
        });
    }
    
    private void handleResetPassword(User user) {
        if (!"STUDENT".equals(user.getRole())) {
            showError("Password reset is only available for students");
            return;
        }
        
        Alert alert = new Alert(Alert.AlertType.CONFIRMATION);
        alert.setTitle("Reset Password");
        alert.setHeaderText("Reset password for student?");
        alert.setContentText("Student: " + user.getFullName() + " (" + user.getUsername() + ")\n\n" +
                            "This will reset their password to their username.\n" +
                            "They will need to change it on their next login.");
        
        alert.showAndWait().ifPresent(response -> {
            if (response == ButtonType.OK) {
                executorService.submit(() -> {
                    try {
                        // Reset password to username using the dedicated method
                        userDAO.resetPassword(user.getId(), user.getUsername());
                        
                        Platform.runLater(() -> {
                            showSuccess("Password reset successfully!\n\n" +
                                      "New password: " + user.getUsername() + "\n" +
                                      "Student must change password on next login.");
                            loadUsers(); // Refresh the table
                        });
                    } catch (SQLException e) {
                        Platform.runLater(() -> {
                            showError("Error resetting password: " + e.getMessage());
                        });
                    }
                });
            }
        });
    }
    
    private void showError(String message) {
        Alert alert = new Alert(Alert.AlertType.ERROR);
        alert.setTitle("Error");
        alert.setHeaderText(null);
        alert.setContentText(message);
        alert.showAndWait();
    }
    
    private void showSuccess(String message) {
        Alert alert = new Alert(Alert.AlertType.INFORMATION);
        alert.setTitle("Success");
        alert.setHeaderText(null);
        alert.setContentText(message);
        alert.showAndWait();
    }
}