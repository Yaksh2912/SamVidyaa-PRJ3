package com.samvidya.controller;

import com.samvidya.dao.CourseEmailAccessDAO;
import com.samvidya.dao.EnrollmentNumberDAO;
import com.samvidya.model.Course;
import javafx.application.Platform;
import javafx.collections.FXCollections;
import javafx.collections.ObservableList;
import javafx.fxml.FXML;
import javafx.scene.control.*;
import javafx.stage.FileChooser;
import javafx.stage.Stage;

import java.io.BufferedReader;
import java.io.File;
import java.io.FileReader;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

public class StudentAccessManagementController {

    @FXML
    private Label courseInfoLabel;

    @FXML
    private TabPane accessTabPane;

    // Enrollment Number Tab
    @FXML
    private TableView<String> enrollmentTable;

    @FXML
    private TableColumn<String, String> enrollmentColumn;

    @FXML
    private TextArea enrollmentInputArea;

    @FXML
    private Button addEnrollmentsButton;

    @FXML
    private Button importEnrollmentCsvButton;

    @FXML
    private Button deleteEnrollmentButton;

    // Email Tab
    @FXML
    private TableView<String> emailTable;

    @FXML
    private TableColumn<String, String> emailColumn;

    @FXML
    private TextArea emailInputArea;

    @FXML
    private Button addEmailsButton;

    @FXML
    private Button importEmailCsvButton;

    @FXML
    private Button deleteEmailButton;

    // Common
    @FXML
    private Button closeButton;

    @FXML
    private Label errorLabel;

    @FXML
    private Label successLabel;

    @FXML
    private Label enrollmentCountLabel;

    @FXML
    private Label emailCountLabel;

    private Course currentCourse;
    private EnrollmentNumberDAO enrollmentNumberDAO;
    private CourseEmailAccessDAO emailAccessDAO;
    private ObservableList<String> enrollmentList;
    private ObservableList<String> emailList;

    @FXML
    private void initialize() {
        enrollmentNumberDAO = new EnrollmentNumberDAO();
        emailAccessDAO = new CourseEmailAccessDAO();
        enrollmentList = FXCollections.observableArrayList();
        emailList = FXCollections.observableArrayList();
        
        hideMessages();

        // Setup enrollment table
        enrollmentColumn.setCellValueFactory(cellData -> 
            new javafx.beans.property.SimpleStringProperty(cellData.getValue()));
        enrollmentTable.setItems(enrollmentList);

        // Setup email table
        emailColumn.setCellValueFactory(cellData -> 
            new javafx.beans.property.SimpleStringProperty(cellData.getValue()));
        emailTable.setItems(emailList);

        // Setup selection listeners
        enrollmentTable.getSelectionModel().selectedItemProperty().addListener((obs, oldSelection, newSelection) -> {
            deleteEnrollmentButton.setDisable(newSelection == null);
        });

        emailTable.getSelectionModel().selectedItemProperty().addListener((obs, oldSelection, newSelection) -> {
            deleteEmailButton.setDisable(newSelection == null);
        });

        deleteEnrollmentButton.setDisable(true);
        deleteEmailButton.setDisable(true);
    }

    public void setCourse(Course course) {
        this.currentCourse = course;
        courseInfoLabel.setText("Student Access Management - " + course.getCourseName());
        loadEnrollmentNumbers();
        loadEmails();
    }

    // ==================== ENROLLMENT NUMBER METHODS ====================

    private void loadEnrollmentNumbers() {
        try {
            List<String> enrollments = enrollmentNumberDAO.findEnrollmentNumbersByCourseId(currentCourse.getId());
            enrollmentList.clear();
            enrollmentList.addAll(enrollments);
            updateEnrollmentCount();
            hideMessages();
        } catch (Exception e) {
            e.printStackTrace();
            showError("Failed to load enrollment numbers: " + e.getMessage());
        }
    }

    @FXML
    private void handleAddEnrollments() {
        String input = enrollmentInputArea.getText().trim();
        if (input.isEmpty()) {
            showError("Please enter at least one enrollment number");
            return;
        }

        try {
            String[] lines = input.split("\\r?\\n");
            List<String> validEnrollments = new ArrayList<>();
            List<String> invalidEnrollments = new ArrayList<>();
            int duplicates = 0;

            for (String line : lines) {
                String enrollment = line.trim();
                if (!enrollment.isEmpty()) {
                    if (isValidEnrollmentPattern(enrollment)) {
                        try {
                            enrollmentNumberDAO.addEnrollmentNumber(enrollment, currentCourse.getId());
                            validEnrollments.add(enrollment);
                        } catch (Exception e) {
                            if (e.getMessage().contains("already") || e.getMessage().contains("duplicate")) {
                                duplicates++;
                            } else {
                                invalidEnrollments.add(enrollment);
                            }
                        }
                    } else {
                        invalidEnrollments.add(enrollment);
                    }
                }
            }

            loadEnrollmentNumbers();
            enrollmentInputArea.clear();

            StringBuilder message = new StringBuilder();
            message.append(validEnrollments.size()).append(" enrollment(s) added successfully!");
            if (duplicates > 0) {
                message.append("\n").append(duplicates).append(" duplicate(s) skipped.");
            }
            if (!invalidEnrollments.isEmpty()) {
                message.append("\n").append(invalidEnrollments.size()).append(" invalid enrollment(s) skipped.");
            }

            showSuccess(message.toString());

        } catch (Exception e) {
            e.printStackTrace();
            showError("Failed to add enrollments: " + e.getMessage());
        }
    }

    @FXML
    private void handleImportEnrollmentCsv() {
        FileChooser fileChooser = new FileChooser();
        fileChooser.setTitle("Select CSV File");
        fileChooser.getExtensionFilters().addAll(
            new FileChooser.ExtensionFilter("CSV Files", "*.csv"),
            new FileChooser.ExtensionFilter("Text Files", "*.txt"),
            new FileChooser.ExtensionFilter("All Files", "*.*")
        );

        File file = fileChooser.showOpenDialog(importEnrollmentCsvButton.getScene().getWindow());
        if (file == null) {
            return;
        }

        try {
            List<String> validEnrollments = new ArrayList<>();
            List<String> invalidEnrollments = new ArrayList<>();
            int duplicates = 0;

            try (BufferedReader br = new BufferedReader(new FileReader(file))) {
                String line;
                boolean firstLine = true;

                while ((line = br.readLine()) != null) {
                    // Skip header if it looks like a header
                    if (firstLine && (line.toLowerCase().contains("enrollment") || line.toLowerCase().contains("number"))) {
                        firstLine = false;
                        continue;
                    }
                    firstLine = false;

                    // Handle CSV with or without commas
                    String[] parts = line.split("[,;\\t]");
                    for (String part : parts) {
                        String enrollment = part.trim().replaceAll("\"", "").replaceAll("'", "");
                        if (!enrollment.isEmpty() && isValidEnrollmentPattern(enrollment)) {
                            try {
                                enrollmentNumberDAO.addEnrollmentNumber(enrollment, currentCourse.getId());
                                validEnrollments.add(enrollment);
                            } catch (Exception e) {
                                if (e.getMessage().contains("already") || e.getMessage().contains("duplicate")) {
                                    duplicates++;
                                } else {
                                    invalidEnrollments.add(enrollment);
                                }
                            }
                        } else if (!enrollment.isEmpty()) {
                            invalidEnrollments.add(enrollment);
                        }
                    }
                }
            }

            loadEnrollmentNumbers();

            StringBuilder message = new StringBuilder();
            message.append(validEnrollments.size()).append(" enrollment(s) imported successfully!");
            if (duplicates > 0) {
                message.append("\n").append(duplicates).append(" duplicate(s) skipped.");
            }
            if (!invalidEnrollments.isEmpty()) {
                message.append("\n").append(invalidEnrollments.size()).append(" invalid enrollment(s) skipped.");
            }

            showSuccess(message.toString());

        } catch (Exception e) {
            e.printStackTrace();
            showError("Failed to import CSV: " + e.getMessage());
        }
    }

    @FXML
    private void handleDeleteEnrollment() {
        String selectedEnrollment = enrollmentTable.getSelectionModel().getSelectedItem();
        if (selectedEnrollment == null) {
            showError("Please select an enrollment number to delete");
            return;
        }

        Alert confirmAlert = new Alert(Alert.AlertType.CONFIRMATION);
        confirmAlert.setTitle("Confirm Delete");
        confirmAlert.setHeaderText("Delete Enrollment Number");
        confirmAlert.setContentText("Remove access for: " + selectedEnrollment + "?");

        Optional<ButtonType> result = confirmAlert.showAndWait();
        if (result.isPresent() && result.get() == ButtonType.OK) {
            try {
                enrollmentNumberDAO.removeEnrollmentNumber(selectedEnrollment, currentCourse.getId());
                loadEnrollmentNumbers();
                showSuccess("Enrollment number removed successfully!");
            } catch (Exception e) {
                e.printStackTrace();
                showError("Failed to delete enrollment: " + e.getMessage());
            }
        }
    }

    // ==================== EMAIL METHODS ====================

    private void loadEmails() {
        try {
            List<String> emails = emailAccessDAO.findEmailsByCourseId(currentCourse.getId());
            emailList.clear();
            emailList.addAll(emails);
            updateEmailCount();
            hideMessages();
        } catch (Exception e) {
            e.printStackTrace();
            showError("Failed to load emails: " + e.getMessage());
        }
    }

    @FXML
    private void handleAddEmails() {
        String input = emailInputArea.getText().trim();
        if (input.isEmpty()) {
            showError("Please enter at least one email address");
            return;
        }

        try {
            String[] lines = input.split("\\r?\\n");
            List<String> validEmails = new ArrayList<>();
            List<String> invalidEmails = new ArrayList<>();
            int duplicates = 0;

            for (String line : lines) {
                String email = line.trim();
                if (!email.isEmpty()) {
                    if (isValidEmail(email)) {
                        try {
                            emailAccessDAO.addEmail(email, currentCourse.getId());
                            validEmails.add(email);
                        } catch (Exception e) {
                            if (e.getMessage().contains("Duplicate")) {
                                duplicates++;
                            } else {
                                invalidEmails.add(email);
                            }
                        }
                    } else {
                        invalidEmails.add(email);
                    }
                }
            }

            loadEmails();
            emailInputArea.clear();

            StringBuilder message = new StringBuilder();
            message.append(validEmails.size()).append(" email(s) added successfully!");
            if (duplicates > 0) {
                message.append("\n").append(duplicates).append(" duplicate(s) skipped.");
            }
            if (!invalidEmails.isEmpty()) {
                message.append("\n").append(invalidEmails.size()).append(" invalid email(s) skipped.");
            }

            showSuccess(message.toString());

        } catch (Exception e) {
            e.printStackTrace();
            showError("Failed to add emails: " + e.getMessage());
        }
    }

    @FXML
    private void handleImportEmailCsv() {
        FileChooser fileChooser = new FileChooser();
        fileChooser.setTitle("Select CSV File");
        fileChooser.getExtensionFilters().addAll(
            new FileChooser.ExtensionFilter("CSV Files", "*.csv"),
            new FileChooser.ExtensionFilter("Text Files", "*.txt"),
            new FileChooser.ExtensionFilter("All Files", "*.*")
        );

        File file = fileChooser.showOpenDialog(importEmailCsvButton.getScene().getWindow());
        if (file == null) {
            return;
        }

        try {
            List<String> validEmails = new ArrayList<>();
            List<String> invalidEmails = new ArrayList<>();
            int duplicates = 0;

            try (BufferedReader br = new BufferedReader(new FileReader(file))) {
                String line;
                boolean firstLine = true;

                while ((line = br.readLine()) != null) {
                    // Skip header if it looks like a header
                    if (firstLine && (line.toLowerCase().contains("email") || line.toLowerCase().contains("mail"))) {
                        firstLine = false;
                        continue;
                    }
                    firstLine = false;

                    // Handle CSV with or without commas
                    String[] parts = line.split("[,;\\t]");
                    for (String part : parts) {
                        String email = part.trim().replaceAll("\"", "").replaceAll("'", "");
                        if (!email.isEmpty() && isValidEmail(email)) {
                            try {
                                emailAccessDAO.addEmail(email, currentCourse.getId());
                                validEmails.add(email);
                            } catch (Exception e) {
                                if (e.getMessage().contains("Duplicate")) {
                                    duplicates++;
                                } else {
                                    invalidEmails.add(email);
                                }
                            }
                        } else if (!email.isEmpty()) {
                            invalidEmails.add(email);
                        }
                    }
                }
            }

            loadEmails();

            StringBuilder message = new StringBuilder();
            message.append(validEmails.size()).append(" email(s) imported successfully!");
            if (duplicates > 0) {
                message.append("\n").append(duplicates).append(" duplicate(s) skipped.");
            }
            if (!invalidEmails.isEmpty()) {
                message.append("\n").append(invalidEmails.size()).append(" invalid email(s) skipped.");
            }

            showSuccess(message.toString());

        } catch (Exception e) {
            e.printStackTrace();
            showError("Failed to import CSV: " + e.getMessage());
        }
    }

    @FXML
    private void handleDeleteEmail() {
        String selectedEmail = emailTable.getSelectionModel().getSelectedItem();
        if (selectedEmail == null) {
            showError("Please select an email to delete");
            return;
        }

        Alert confirmAlert = new Alert(Alert.AlertType.CONFIRMATION);
        confirmAlert.setTitle("Confirm Delete");
        confirmAlert.setHeaderText("Delete Email Access");
        confirmAlert.setContentText("Remove access for: " + selectedEmail + "?");

        Optional<ButtonType> result = confirmAlert.showAndWait();
        if (result.isPresent() && result.get() == ButtonType.OK) {
            try {
                emailAccessDAO.removeEmail(selectedEmail, currentCourse.getId());
                loadEmails();
                showSuccess("Email access removed successfully!");
            } catch (Exception e) {
                e.printStackTrace();
                showError("Failed to delete email: " + e.getMessage());
            }
        }
    }

    // ==================== UTILITY METHODS ====================

    @FXML
    private void handleClose() {
        Stage stage = (Stage) closeButton.getScene().getWindow();
        stage.close();
    }

    private boolean isValidEnrollmentPattern(String pattern) {
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

    private boolean isValidEmail(String email) {
        if (email == null || email.isEmpty()) {
            return false;
        }
        return email.matches("^[A-Za-z0-9+_.-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$");
    }

    private void updateEnrollmentCount() {
        if (enrollmentCountLabel != null) {
            enrollmentCountLabel.setText(enrollmentList.size() + " enrollment(s)");
        }
    }

    private void updateEmailCount() {
        if (emailCountLabel != null) {
            emailCountLabel.setText(emailList.size() + " email(s)");
        }
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
        
        // Auto-hide success message after 3 seconds
        new Thread(() -> {
            try {
                Thread.sleep(3000);
                Platform.runLater(() -> successLabel.setVisible(false));
            } catch (InterruptedException e) {
                e.printStackTrace();
            }
        }).start();
    }

    private void hideMessages() {
        errorLabel.setVisible(false);
        successLabel.setVisible(false);
    }
}
