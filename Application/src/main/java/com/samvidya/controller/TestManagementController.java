package com.samvidya.controller;

import com.samvidya.dao.CodingQuestionDAO;
import com.samvidya.model.CodingQuestion;
import com.samvidya.model.Course;
import com.samvidya.model.Module;
import javafx.collections.FXCollections;
import javafx.collections.ObservableList;
import javafx.fxml.FXML;
import javafx.fxml.FXMLLoader;
import javafx.scene.Parent;
import javafx.scene.Scene;
import javafx.scene.control.*;
import javafx.scene.control.cell.PropertyValueFactory;
import javafx.stage.Modality;
import javafx.stage.Stage;

import java.util.List;
import java.util.Optional;

public class TestManagementController {

    @FXML
    private Label testInfoLabel;

    @FXML
    private TabPane testTabPane;

    @FXML
    private Tab moduleTestTab;

    @FXML
    private Tab courseTestTab;

    @FXML
    private TableView<CodingQuestion> moduleTestTable;

    @FXML
    private TableColumn<CodingQuestion, String> moduleQuestionColumn;

    @FXML
    private TableColumn<CodingQuestion, String> moduleDifficultyColumn;

    @FXML
    private TableColumn<CodingQuestion, Integer> modulePointsColumn;

    @FXML
    private TableColumn<CodingQuestion, Integer> moduleTimeLimitColumn;

    @FXML
    private Button addModuleTestButton;

    @FXML
    private Button editModuleTestButton;

    @FXML
    private Button deleteModuleTestButton;

    @FXML
    private TableView<CodingQuestion> courseTestTable;

    @FXML
    private TableColumn<CodingQuestion, String> courseQuestionColumn;

    @FXML
    private TableColumn<CodingQuestion, String> courseDifficultyColumn;

    @FXML
    private TableColumn<CodingQuestion, Integer> coursePointsColumn;

    @FXML
    private TableColumn<CodingQuestion, Integer> courseTimeLimitColumn;

    @FXML
    private Button addCourseTestButton;

    @FXML
    private Button editCourseTestButton;

    @FXML
    private Button deleteCourseTestButton;

    @FXML
    private Button closeButton;

    @FXML
    private Label errorLabel;

    private Module currentModule;
    private Course currentCourse;
    private CodingQuestionDAO codingQuestionDAO;
    private ObservableList<CodingQuestion> moduleTestsList;
    private ObservableList<CodingQuestion> courseTestsList;
    private CourseManagementController parentController;

    @FXML
    private void initialize() {
        codingQuestionDAO = new CodingQuestionDAO();
        moduleTestsList = FXCollections.observableArrayList();
        courseTestsList = FXCollections.observableArrayList();
        errorLabel.setVisible(false);

        // Setup module test table
        moduleQuestionColumn.setCellValueFactory(new PropertyValueFactory<>("questionText"));
        moduleDifficultyColumn.setCellValueFactory(new PropertyValueFactory<>("difficulty"));
        modulePointsColumn.setCellValueFactory(new PropertyValueFactory<>("points"));
        moduleTimeLimitColumn.setCellValueFactory(new PropertyValueFactory<>("timeLimit"));
        moduleTestTable.setItems(moduleTestsList);

        // Setup course test table
        courseQuestionColumn.setCellValueFactory(new PropertyValueFactory<>("questionText"));
        courseDifficultyColumn.setCellValueFactory(new PropertyValueFactory<>("difficulty"));
        coursePointsColumn.setCellValueFactory(new PropertyValueFactory<>("points"));
        courseTimeLimitColumn.setCellValueFactory(new PropertyValueFactory<>("timeLimit"));
        courseTestTable.setItems(courseTestsList);

        // Setup table selection listeners
        moduleTestTable.getSelectionModel().selectedItemProperty().addListener((obs, oldSelection, newSelection) -> {
            boolean hasSelection = newSelection != null;
            editModuleTestButton.setDisable(!hasSelection);
            deleteModuleTestButton.setDisable(!hasSelection);
        });

        courseTestTable.getSelectionModel().selectedItemProperty().addListener((obs, oldSelection, newSelection) -> {
            boolean hasSelection = newSelection != null;
            editCourseTestButton.setDisable(!hasSelection);
            deleteCourseTestButton.setDisable(!hasSelection);
        });

        // Initially disable buttons
        editModuleTestButton.setDisable(true);
        deleteModuleTestButton.setDisable(true);
        editCourseTestButton.setDisable(true);
        deleteCourseTestButton.setDisable(true);
    }

    public void setModule(Module module) {
        this.currentModule = module;
        testInfoLabel.setText("Test Management - " + module.getModuleName());
        loadModuleTests();
    }

    public void setCourse(Course course) {
        this.currentCourse = course;
        loadCourseTests();
    }

    public void setParentController(CourseManagementController parentController) {
        this.parentController = parentController;
    }

    private void loadModuleTests() {
        try {
            List<CodingQuestion> questions = codingQuestionDAO.findByModuleId(currentModule.getId());
            moduleTestsList.clear();
            moduleTestsList.addAll(questions);
        } catch (Exception e) {
            e.printStackTrace();
            showError("Failed to load module tests: " + e.getMessage());
        }
    }

    private void loadCourseTests() {
        try {
            List<CodingQuestion> questions = codingQuestionDAO.findByCourseId(currentCourse.getId());
            courseTestsList.clear();
            courseTestsList.addAll(questions);
        } catch (Exception e) {
            e.printStackTrace();
            showError("Failed to load course tests: " + e.getMessage());
        }
    }

    @FXML
    private void handleAddModuleTest() {
        openQuestionDialog(null, true);
    }

    @FXML
    private void handleEditModuleTest() {
        CodingQuestion selectedQuestion = moduleTestTable.getSelectionModel().getSelectedItem();
        if (selectedQuestion == null) {
            showError("Please select a module test question to edit");
            return;
        }
        openQuestionDialog(selectedQuestion, true);
    }

    @FXML
    private void handleDeleteModuleTest() {
        CodingQuestion selectedQuestion = moduleTestTable.getSelectionModel().getSelectedItem();
        if (selectedQuestion == null) {
            showError("Please select a module test question to delete");
            return;
        }
        deleteQuestion(selectedQuestion, true);
    }

    @FXML
    private void handleAddCourseTest() {
        openQuestionDialog(null, false);
    }

    @FXML
    private void handleEditCourseTest() {
        CodingQuestion selectedQuestion = courseTestTable.getSelectionModel().getSelectedItem();
        if (selectedQuestion == null) {
            showError("Please select a course test question to edit");
            return;
        }
        openQuestionDialog(selectedQuestion, false);
    }

    @FXML
    private void handleDeleteCourseTest() {
        CodingQuestion selectedQuestion = courseTestTable.getSelectionModel().getSelectedItem();
        if (selectedQuestion == null) {
            showError("Please select a course test question to delete");
            return;
        }
        deleteQuestion(selectedQuestion, false);
    }

    private void openQuestionDialog(CodingQuestion question, boolean isModuleTest) {
        try {
            FXMLLoader loader = new FXMLLoader(getClass().getResource("/fxml/CodingQuestionDialog.fxml"));
            Parent root = loader.load();

            CodingQuestionDialogController controller = loader.getController();
            
            if (isModuleTest) {
                // For module tests, set both moduleId and courseId (required by schema)
                controller.setModuleAndCourse(currentModule.getId(), currentCourse.getId());
            } else {
                // For course tests, only set courseId
                controller.setCourseId(currentCourse.getId());
            }
            
            controller.setQuestion(question);

            Stage stage = new Stage();
            stage.setTitle((question == null ? "Add " : "Edit ") + (isModuleTest ? "Module" : "Course") + " Test Question");
            stage.setScene(new Scene(root));
            stage.getScene().getStylesheets().add(getClass().getResource("/css/style.css").toExternalForm());
            stage.initModality(Modality.WINDOW_MODAL);
            stage.initOwner(addModuleTestButton.getScene().getWindow());
            stage.setResizable(true);
            stage.showAndWait();

            // Refresh questions after dialog closes
            if (isModuleTest) {
                loadModuleTests();
            } else {
                loadCourseTests();
            }

        } catch (Exception e) {
            e.printStackTrace();
            showError("Failed to open question dialog: " + e.getMessage());
        }
    }

    private void deleteQuestion(CodingQuestion question, boolean isModuleTest) {
        Alert confirmAlert = new Alert(Alert.AlertType.CONFIRMATION);
        confirmAlert.setTitle("Confirm Delete");
        confirmAlert.setHeaderText("Delete Test Question");
        confirmAlert.setContentText("Are you sure you want to delete this test question?\n\nThis will also delete all test cases associated with this question.");

        Optional<ButtonType> result = confirmAlert.showAndWait();
        if (result.isPresent() && result.get() == ButtonType.OK) {
            try {
                codingQuestionDAO.delete(question.getId());
                
                if (isModuleTest) {
                    loadModuleTests();
                } else {
                    loadCourseTests();
                }
                
                Alert successAlert = new Alert(Alert.AlertType.INFORMATION);
                successAlert.setTitle("Success");
                successAlert.setHeaderText(null);
                successAlert.setContentText("Test question deleted successfully!");
                successAlert.showAndWait();

            } catch (Exception e) {
                e.printStackTrace();
                showError("Failed to delete test question: " + e.getMessage());
            }
        }
    }

    @FXML
    private void handleClose() {
        Stage stage = (Stage) closeButton.getScene().getWindow();
        stage.close();
    }

    private void showError(String message) {
        errorLabel.setText(message);
        errorLabel.setVisible(true);
    }
}