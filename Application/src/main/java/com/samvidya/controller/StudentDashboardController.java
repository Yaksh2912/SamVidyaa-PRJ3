package com.samvidya.controller;

import com.samvidya.dao.CourseDAO;
import com.samvidya.dao.CourseEmailAccessDAO;
import com.samvidya.dao.EnrollmentNumberDAO;
import com.samvidya.dao.PeerHelpDAO;
import com.samvidya.dao.TaskDAO;
import com.samvidya.dao.ModuleDAO;
import com.samvidya.model.Course;
import com.samvidya.model.PeerHelpRequest;
import com.samvidya.model.User;
import com.samvidya.service.StudentProgressService;
import javafx.animation.Animation;
import javafx.animation.KeyFrame;
import javafx.animation.Timeline;
import javafx.collections.FXCollections;
import javafx.collections.ObservableList;
import javafx.fxml.FXML;
import javafx.fxml.FXMLLoader;
import javafx.scene.Parent;
import javafx.scene.Scene;
import javafx.scene.control.*;
import javafx.scene.control.cell.PropertyValueFactory;
import javafx.scene.layout.HBox;
import javafx.stage.Stage;
import javafx.util.Duration;

import java.util.ArrayList;
import java.util.List;

public class StudentDashboardController {

    @FXML
    private Label welcomeLabel;

    @FXML
    private Label enrollmentLabel;

    @FXML
    private Label totalPointsLabel;

    @FXML
    private TableView<CourseProgressWrapper> coursesTable;

    @FXML
    private TableColumn<CourseProgressWrapper, String> courseCodeColumn;

    @FXML
    private TableColumn<CourseProgressWrapper, String> courseNameColumn;

    @FXML
    private TableColumn<CourseProgressWrapper, String> subjectColumn;

    @FXML
    private TableColumn<CourseProgressWrapper, String> instructorColumn;

    @FXML
    private TableColumn<CourseProgressWrapper, String> progressColumn;

    @FXML
    private TableColumn<CourseProgressWrapper, String> coursePointsColumn;

    @FXML
    private TableColumn<CourseProgressWrapper, String> statusColumn;

    @FXML
    private TableColumn<CourseProgressWrapper, String> nextActionColumn;

    @FXML
    private Button startCourseButton;

    @FXML
    private Button viewProgressButton;

    @FXML
    private Button logoutButton;

    @FXML
    private Label errorLabel;

    // Peer help notification bar
    @FXML private HBox peerHelpNotificationBar;
    @FXML private Label peerHelpNotificationLabel;
    @FXML private Button acceptPeerHelpButton;
    @FXML private Button rejectPeerHelpButton;

    private User currentUser;
    private CourseDAO courseDAO;
    private EnrollmentNumberDAO enrollmentNumberDAO;
    private CourseEmailAccessDAO emailAccessDAO;
    private StudentProgressService progressService;
    private ObservableList<CourseProgressWrapper> coursesList;
    private final PeerHelpDAO peerHelpDAO = new PeerHelpDAO();
    private final TaskDAO taskDAO = new TaskDAO();
    private final ModuleDAO moduleDAO = new ModuleDAO();
    private Timeline peerHelpPoller;
    private PeerHelpRequest pendingPeerRequest; // currently shown request

    @FXML
    private void initialize() {
        courseDAO = new CourseDAO();
        enrollmentNumberDAO = new EnrollmentNumberDAO();
        emailAccessDAO = new CourseEmailAccessDAO();
        progressService = new StudentProgressService();
        coursesList = FXCollections.observableArrayList();
        errorLabel.setVisible(false);

        // Setup courses table
        courseCodeColumn.setCellValueFactory(new PropertyValueFactory<>("courseCode"));
        courseNameColumn.setCellValueFactory(new PropertyValueFactory<>("courseName"));
        subjectColumn.setCellValueFactory(new PropertyValueFactory<>("subject"));
        instructorColumn.setCellValueFactory(new PropertyValueFactory<>("instructorName"));
        progressColumn.setCellValueFactory(new PropertyValueFactory<>("progressText"));
        coursePointsColumn.setCellValueFactory(new PropertyValueFactory<>("coursePointsText"));
        statusColumn.setCellValueFactory(new PropertyValueFactory<>("statusText"));
        nextActionColumn.setCellValueFactory(new PropertyValueFactory<>("nextActionText"));

        // Add custom cell factories for styling
        progressColumn.setCellFactory(column -> new TableCell<CourseProgressWrapper, String>() {
            @Override
            protected void updateItem(String item, boolean empty) {
                super.updateItem(item, empty);
                if (empty || item == null) {
                    setText(null);
                    setStyle("");
                } else {
                    setText(item);
                    CourseProgressWrapper wrapper = getTableView().getItems().get(getIndex());
                    setStyle("-fx-text-fill: " + wrapper.getProgressColor() + "; -fx-font-weight: bold;");
                }
            }
        });

        coursePointsColumn.setCellFactory(column -> new TableCell<CourseProgressWrapper, String>() {
            @Override
            protected void updateItem(String item, boolean empty) {
                super.updateItem(item, empty);
                if (empty || item == null) {
                    setText(null);
                    setStyle("");
                } else {
                    setText(item);
                    setStyle("-fx-text-fill: #ffc107; -fx-font-weight: bold;");
                }
            }
        });

        statusColumn.setCellFactory(column -> new TableCell<CourseProgressWrapper, String>() {
            @Override
            protected void updateItem(String item, boolean empty) {
                super.updateItem(item, empty);
                if (empty || item == null) {
                    setText(null);
                    setStyle("");
                } else {
                    setText(item);
                    CourseProgressWrapper wrapper = getTableView().getItems().get(getIndex());
                    setStyle("-fx-text-fill: " + wrapper.getStatusColor() + "; -fx-font-weight: bold;");
                }
            }
        });

        nextActionColumn.setCellFactory(column -> new TableCell<CourseProgressWrapper, String>() {
            @Override
            protected void updateItem(String item, boolean empty) {
                super.updateItem(item, empty);
                if (empty || item == null) {
                    setText(null);
                    setStyle("");
                } else {
                    setText(item);
                    setStyle("-fx-text-fill: #007bff; -fx-font-style: italic;");
                }
            }
        });

        coursesTable.setItems(coursesList);

        // Setup table selection listener
        coursesTable.getSelectionModel().selectedItemProperty().addListener((obs, oldSelection, newSelection) -> {
            boolean hasSelection = newSelection != null;
            startCourseButton.setDisable(!hasSelection);
            viewProgressButton.setDisable(!hasSelection);
        });

        // Initially disable buttons
        startCourseButton.setDisable(true);
        viewProgressButton.setDisable(true);
    }

    public void setCurrentUser(User user) {
        this.currentUser = user;
        welcomeLabel.setText("Welcome, " + user.getFullName());
        enrollmentLabel.setText("Enrollment Number: " + user.getEnrollmentNumber());
        
        // Display total points
        int totalPoints = user.getTotalPoints() != null ? user.getTotalPoints() : 0;
        totalPointsLabel.setText(String.valueOf(totalPoints));
        
        loadAvailableCourses();
        startPeerHelpPolling();
    }

    private void loadAvailableCourses() {
        try {
            // Find courses this student has access to via enrollment number OR email
            List<Long> allowedCourseIds = new ArrayList<>();
            
            // Check enrollment number access
            if (currentUser.getEnrollmentNumber() != null && !currentUser.getEnrollmentNumber().isEmpty()) {
                allowedCourseIds.addAll(enrollmentNumberDAO.findCourseIdsForEnrollmentNumber(currentUser.getEnrollmentNumber()));
            }
            
            // Check email access
            if (currentUser.getEmail() != null && !currentUser.getEmail().isEmpty()) {
                allowedCourseIds.addAll(emailAccessDAO.findCourseIdsForEmail(currentUser.getEmail()));
            }
            
            // Remove duplicates
            allowedCourseIds = new ArrayList<>(new java.util.HashSet<>(allowedCourseIds));
            
            if (allowedCourseIds.isEmpty()) {
                showError("No courses found for your enrollment number or email. Please contact your instructor.");
                return;
            }

            // Load course details with progress
            coursesList.clear();
            for (Long courseId : allowedCourseIds) {
                Course course = courseDAO.findById(courseId);
                if (course != null && course.isActive()) {
                    // Get course progress
                    StudentProgressService.CourseCompletionSummary summary = null;
                    try {
                        summary = progressService.getCourseCompletionSummary(currentUser.getId(), courseId);
                    } catch (Exception e) {
                        // If no progress exists, create wrapper with null summary
                        System.out.println("No progress found for course " + courseId + ": " + e.getMessage());
                    }
                    
                    CourseProgressWrapper wrapper = new CourseProgressWrapper(course, summary);
                    coursesList.add(wrapper);
                }
            }

            if (coursesList.isEmpty()) {
                showError("No active courses found for your enrollment number.");
            }

        } catch (Exception e) {
            e.printStackTrace();
            showError("Failed to load courses: " + e.getMessage());
        }
    }

    @FXML
    private void handleStartCourse() {
        CourseProgressWrapper selectedWrapper = coursesTable.getSelectionModel().getSelectedItem();
        if (selectedWrapper == null) {
            showError("Please select a course to start");
            return;
        }

        try {
            FXMLLoader loader = new FXMLLoader(getClass().getResource("/fxml/CourseOverview.fxml"));
            Parent root = loader.load();

            CourseOverviewController controller = loader.getController();
            controller.setCurrentUser(currentUser);
            controller.setCourse(selectedWrapper.getCourse());

            Stage stage = new Stage();
            stage.setTitle("Course Overview - " + selectedWrapper.getCourse().getCourseName());
            stage.setScene(new Scene(root));
            stage.getScene().getStylesheets().add(getClass().getResource("/css/style.css").toExternalForm());
            stage.setMaximized(true);
            
            // Refresh progress when window closes
            stage.setOnHidden(e -> loadAvailableCourses());
            
            stage.show();

        } catch (Exception e) {
            e.printStackTrace();
            showError("Failed to open course: " + e.getMessage());
        }
    }

    @FXML
    private void handleViewProgress() {
        CourseProgressWrapper selectedWrapper = coursesTable.getSelectionModel().getSelectedItem();
        if (selectedWrapper == null) {
            showError("Please select a course to view progress");
            return;
        }

        // For now, just open the course overview which shows detailed progress
        handleStartCourse();
    }

    // ── Peer Help Polling ────────────────────────────────────────────────────

    private void startPeerHelpPolling() {
        peerHelpPoller = new Timeline(new KeyFrame(Duration.seconds(5), e -> pollPeerHelpRequests()));
        peerHelpPoller.setCycleCount(Animation.INDEFINITE);
        peerHelpPoller.play();
    }

    private void pollPeerHelpRequests() {
        if (pendingPeerRequest != null) return; // already showing one
        try {
            peerHelpDAO.expireOldRequests();
            List<PeerHelpRequest> pending = peerHelpDAO.findPendingForHelper(currentUser.getId());
            if (!pending.isEmpty()) {
                pendingPeerRequest = pending.get(0);
                showPeerHelpNotification(pendingPeerRequest);
            }
        } catch (Exception ex) {
            ex.printStackTrace();
        }
    }

    private void showPeerHelpNotification(PeerHelpRequest req) {
        peerHelpNotificationLabel.setText(
            "🤝 " + req.getRequesterName() + " needs help with task: \"" + req.getTaskName() + "\"" +
            " in " + req.getCourseName() + "  — expires in ~1 min");
        peerHelpNotificationBar.setVisible(true);
        peerHelpNotificationBar.setManaged(true);
    }

    @FXML
    private void handleAcceptPeerHelp() {
        if (pendingPeerRequest == null) return;
        try {
            peerHelpDAO.updateStatus(pendingPeerRequest.getId(), "ACCEPTED");
            hidePeerHelpBar();

            // Load task, module, course, requester
            com.samvidya.model.Task task = taskDAO.findById(pendingPeerRequest.getTaskId());
            com.samvidya.model.Module module = moduleDAO.findById(pendingPeerRequest.getModuleId());
            CourseDAO cDao = new CourseDAO();
            Course course = cDao.findById(pendingPeerRequest.getCourseId());
            com.samvidya.dao.UserDAO uDao = new com.samvidya.dao.UserDAO();
            User requester = uDao.findById(pendingPeerRequest.getRequesterId());

            FXMLLoader loader = new FXMLLoader(getClass().getResource("/fxml/PeerHelpTask.fxml"));
            Parent root = loader.load();
            PeerHelpTaskController ctrl = loader.getController();
            ctrl.setup(currentUser, pendingPeerRequest, task, module, course, requester);

            Stage stage = new Stage();
            stage.setTitle("Peer Help — " + task.getTaskName());
            stage.setScene(new Scene(root, 1100, 700));
            stage.getScene().getStylesheets().add(getClass().getResource("/css/style.css").toExternalForm());
            stage.setResizable(true);
            stage.show();

        } catch (Exception e) {
            e.printStackTrace();
            showError("Failed to open peer help task: " + e.getMessage());
        } finally {
            pendingPeerRequest = null;
        }
    }

    @FXML
    private void handleRejectPeerHelp() {
        if (pendingPeerRequest == null) return;
        try {
            peerHelpDAO.updateStatus(pendingPeerRequest.getId(), "REJECTED");
        } catch (Exception e) {
            e.printStackTrace();
        }
        pendingPeerRequest = null;
        hidePeerHelpBar();
    }

    private void hidePeerHelpBar() {
        peerHelpNotificationBar.setVisible(false);
        peerHelpNotificationBar.setManaged(false);
    }

    // ─────────────────────────────────────────────────────────────────────────

    @FXML
    private void handleLogout() {
        if (peerHelpPoller != null) peerHelpPoller.stop();
        try {
            FXMLLoader loader = new FXMLLoader(getClass().getResource("/fxml/RoleSelection.fxml"));
            Parent root = loader.load();

            Stage stage = (Stage) logoutButton.getScene().getWindow();
            Scene scene = new Scene(root);
            scene.getStylesheets().add(getClass().getResource("/css/style.css").toExternalForm());
            
            stage.setTitle("SamVidya - Role Selection");
            stage.setScene(scene);
            stage.centerOnScreen();

        } catch (Exception e) {
            e.printStackTrace();
            showError("Failed to logout: " + e.getMessage());
        }
    }

    private void showError(String message) {
        errorLabel.setText(message);
        errorLabel.setVisible(true);
    }

    // Wrapper class for displaying course with progress information
    public static class CourseProgressWrapper {
        private final Course course;
        private final StudentProgressService.CourseCompletionSummary summary;

        public CourseProgressWrapper(Course course, StudentProgressService.CourseCompletionSummary summary) {
            this.course = course;
            this.summary = summary;
        }

        public Course getCourse() { return course; }
        public StudentProgressService.CourseCompletionSummary getSummary() { return summary; }

        public String getCourseCode() { return course.getCourseCode(); }
        public String getCourseName() { return course.getCourseName(); }
        public String getSubject() { return course.getSubject(); }
        public String getInstructorName() { return course.getInstructorName(); }

        public String getProgressText() {
            if (summary == null) return "Not Started (0%)";
            return String.format("%d/%d modules (%.1f%%)", 
                summary.getModulesCompleted(), summary.getTotalModules(), summary.getOverallProgressPercentage());
        }

        public String getProgressColor() {
            if (summary == null) return "#6c757d"; // Gray
            double progress = summary.getOverallProgressPercentage();
            if (progress == 0) return "#6c757d"; // Gray
            if (progress < 50) return "#ffc107"; // Yellow
            if (progress < 100) return "#17a2b8"; // Blue
            return "#28a745"; // Green
        }

        public String getCoursePointsText() {
            if (summary == null) return "0 pts";
            return summary.getTotalCoursePoints() + " pts";
        }

        public String getStatusText() {
            if (summary == null) return "Not Started";
            if (summary.isCourseTestCompleted()) {
                return summary.isCourseTestPassed() ? "Completed ✓" : "Test Failed";
            }
            if (summary.isCanAttemptCourseTest()) return "Ready for Final Test";
            if (summary.getModulesCompleted() > 0) return "In Progress";
            return "Not Started";
        }

        public String getStatusColor() {
            if (summary == null) return "#6c757d"; // Gray
            if (summary.isCourseTestCompleted()) {
                return summary.isCourseTestPassed() ? "#28a745" : "#dc3545"; // Green or Red
            }
            if (summary.isCanAttemptCourseTest()) return "#17a2b8"; // Blue
            if (summary.getModulesCompleted() > 0) return "#ffc107"; // Yellow
            return "#6c757d"; // Gray
        }

        public String getNextActionText() {
            if (summary == null) return "Start first module";
            if (summary.isCourseTestCompleted()) {
                return summary.isCourseTestPassed() ? "Course completed!" : "Retake final test";
            }
            if (summary.isCanAttemptCourseTest()) return "Take final test";
            
            int currentModule = summary.getCurrentModuleOrder();
            if (currentModule <= summary.getTotalModules()) {
                return "Continue Module " + currentModule;
            }
            return "Complete remaining modules";
        }
    }
}