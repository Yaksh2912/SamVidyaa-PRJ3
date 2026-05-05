package com.samvidya.controller;

import com.samvidya.dao.TaskDAO;
import com.samvidya.model.Module;
import com.samvidya.model.Task;
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

public class TaskManagementController {

    @FXML
    private Label moduleInfoLabel;

    @FXML
    private TableView<Task> tasksTable;

    @FXML
    private TableColumn<Task, String> taskNameColumn;

    @FXML
    private TableColumn<Task, String> difficultyColumn;

    @FXML
    private TableColumn<Task, Integer> pointsColumn;

    @FXML
    private TableColumn<Task, Integer> timeLimitColumn;

    @FXML
    private TableColumn<Task, String> languageColumn;

    @FXML
    private Button addTaskButton;

    @FXML
    private Button editTaskButton;

    @FXML
    private Button deleteTaskButton;

    @FXML
    private Button closeButton;

    @FXML
    private Label errorLabel;

    private Module currentModule;
    private TaskDAO taskDAO;
    private ObservableList<Task> tasksList;
    private CourseManagementController parentController;

    @FXML
    private void initialize() {
        taskDAO = new TaskDAO();
        tasksList = FXCollections.observableArrayList();
        errorLabel.setVisible(false);

        // Setup tasks table
        taskNameColumn.setCellValueFactory(new PropertyValueFactory<>("taskName"));
        difficultyColumn.setCellValueFactory(new PropertyValueFactory<>("difficulty"));
        pointsColumn.setCellValueFactory(new PropertyValueFactory<>("points"));
        timeLimitColumn.setCellValueFactory(new PropertyValueFactory<>("timeLimit"));
        languageColumn.setCellValueFactory(new PropertyValueFactory<>("language"));

        tasksTable.setItems(tasksList);

        // Setup table selection listener
        tasksTable.getSelectionModel().selectedItemProperty().addListener((obs, oldSelection, newSelection) -> {
            boolean hasSelection = newSelection != null;
            editTaskButton.setDisable(!hasSelection);
            deleteTaskButton.setDisable(!hasSelection);
        });

        // Initially disable buttons
        editTaskButton.setDisable(true);
        deleteTaskButton.setDisable(true);
    }

    public void setModule(Module module) {
        this.currentModule = module;
        moduleInfoLabel.setText("Tasks for Module: " + module.getModuleName());
        loadTasks();
    }

    public void setParentController(CourseManagementController parentController) {
        this.parentController = parentController;
    }

    private void loadTasks() {
        try {
            List<Task> tasks = taskDAO.findByModuleId(currentModule.getId());
            tasksList.clear();
            tasksList.addAll(tasks);
        } catch (Exception e) {
            e.printStackTrace();
            showError("Failed to load tasks: " + e.getMessage());
        }
    }

    @FXML
    private void handleAddTask() {
        try {
            FXMLLoader loader = new FXMLLoader(getClass().getResource("/fxml/TaskDialog.fxml"));
            Parent root = loader.load();

            TaskDialogController controller = loader.getController();
            controller.setModule(currentModule);
            controller.setTask(null); // New task
            controller.setParentController(null); // We'll refresh ourselves

            Stage stage = new Stage();
            stage.setTitle("Add New Task");
            stage.setScene(new Scene(root));
            stage.getScene().getStylesheets().add(getClass().getResource("/css/style.css").toExternalForm());
            stage.initModality(Modality.WINDOW_MODAL);
            stage.initOwner(addTaskButton.getScene().getWindow());
            stage.setResizable(true);
            stage.showAndWait();

            // Refresh tasks after dialog closes
            loadTasks();

        } catch (Exception e) {
            e.printStackTrace();
            showError("Failed to open add task dialog: " + e.getMessage());
        }
    }

    @FXML
    private void handleEditTask() {
        Task selectedTask = tasksTable.getSelectionModel().getSelectedItem();
        if (selectedTask == null) {
            showError("Please select a task to edit");
            return;
        }

        try {
            FXMLLoader loader = new FXMLLoader(getClass().getResource("/fxml/TaskDialog.fxml"));
            Parent root = loader.load();

            TaskDialogController controller = loader.getController();
            controller.setModule(currentModule);
            controller.setTask(selectedTask); // Edit existing task
            controller.setParentController(null); // We'll refresh ourselves

            Stage stage = new Stage();
            stage.setTitle("Edit Task");
            stage.setScene(new Scene(root));
            stage.getScene().getStylesheets().add(getClass().getResource("/css/style.css").toExternalForm());
            stage.initModality(Modality.WINDOW_MODAL);
            stage.initOwner(editTaskButton.getScene().getWindow());
            stage.setResizable(true);
            stage.showAndWait();

            // Refresh tasks after dialog closes
            loadTasks();

        } catch (Exception e) {
            e.printStackTrace();
            showError("Failed to open edit task dialog: " + e.getMessage());
        }
    }

    @FXML
    private void handleDeleteTask() {
        Task selectedTask = tasksTable.getSelectionModel().getSelectedItem();
        if (selectedTask == null) {
            showError("Please select a task to delete");
            return;
        }

        Alert confirmAlert = new Alert(Alert.AlertType.CONFIRMATION);
        confirmAlert.setTitle("Confirm Delete");
        confirmAlert.setHeaderText("Delete Task");
        confirmAlert.setContentText("Are you sure you want to delete the task '" + selectedTask.getTaskName() + "'?\n\nThis will also delete all student attempts for this task.");

        Optional<ButtonType> result = confirmAlert.showAndWait();
        if (result.isPresent() && result.get() == ButtonType.OK) {
            try {
                taskDAO.delete(selectedTask.getId());
                loadTasks(); // Refresh the table
                
                Alert successAlert = new Alert(Alert.AlertType.INFORMATION);
                successAlert.setTitle("Success");
                successAlert.setHeaderText(null);
                successAlert.setContentText("Task deleted successfully!");
                successAlert.showAndWait();

            } catch (Exception e) {
                e.printStackTrace();
                showError("Failed to delete task: " + e.getMessage());
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