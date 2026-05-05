package com.samvidya.controller;

import com.samvidya.dao.AnalyticsDAO;
import com.samvidya.model.Course;
import com.samvidya.service.MongoSyncService;
import javafx.application.Platform;
import javafx.beans.property.SimpleStringProperty;
import javafx.collections.FXCollections;
import javafx.collections.ObservableList;
import javafx.concurrent.Task;
import javafx.fxml.FXML;
import javafx.scene.control.*;
import javafx.stage.Stage;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

public class CourseAnalyticsController {

    // Header
    @FXML private Label titleLabel;

    // Sync button
    @FXML private Button syncButton;

    // Section filter
    @FXML private ComboBox<String> sectionCombo;

    // Analytics labels
    @FXML private Label avgTasksLabel;
    @FXML private Label avgModulesLabel;
    @FXML private Label avgQuestionsLabel;
    @FXML private Label avgPtsTaskLabel;
    @FXML private Label avgPtsModuleLabel;
    @FXML private Label avgPtsQuestionLabel;
    @FXML private Label avgPtsCourseLabel;
    @FXML private Label avgAttemptsLabel;
    @FXML private Label courseTestPassRateLabel;

    // Funnel table
    @FXML private TableView<String[]> funnelTable;
    @FXML private TableColumn<String[], String> funnelModuleCol;
    @FXML private TableColumn<String[], String> funnelStudentsCol;

    // Task pass rate table
    @FXML private TableView<String[]> taskPassTable;
    @FXML private TableColumn<String[], String> taskNameCol;
    @FXML private TableColumn<String[], String> taskPassRateCol;

    // Leaderboard tables
    @FXML private TableView<String[]> lbTasksTable;
    @FXML private TableColumn<String[], String> lbTasksRankCol;
    @FXML private TableColumn<String[], String> lbTasksNameCol;
    @FXML private TableColumn<String[], String> lbTasksSectionCol;
    @FXML private TableColumn<String[], String> lbTasksValCol;

    @FXML private TableView<String[]> lbPerfectTasksTable;
    @FXML private TableColumn<String[], String> lbPTRankCol;
    @FXML private TableColumn<String[], String> lbPTNameCol;
    @FXML private TableColumn<String[], String> lbPTSectionCol;
    @FXML private TableColumn<String[], String> lbPTValCol;

    @FXML private TableView<String[]> lbQuestionsTable;
    @FXML private TableColumn<String[], String> lbQRankCol;
    @FXML private TableColumn<String[], String> lbQNameCol;
    @FXML private TableColumn<String[], String> lbQSectionCol;
    @FXML private TableColumn<String[], String> lbQValCol;

    @FXML private TableView<String[]> lbPerfectQTable;
    @FXML private TableColumn<String[], String> lbPQRankCol;
    @FXML private TableColumn<String[], String> lbPQNameCol;
    @FXML private TableColumn<String[], String> lbPQSectionCol;
    @FXML private TableColumn<String[], String> lbPQValCol;

    @FXML private TableView<String[]> lbPointsTable;
    @FXML private TableColumn<String[], String> lbPtsRankCol;
    @FXML private TableColumn<String[], String> lbPtsNameCol;
    @FXML private TableColumn<String[], String> lbPtsSectionCol;
    @FXML private TableColumn<String[], String> lbPtsValCol;

    @FXML private TableView<String[]> lbPeerHelpsTable;
    @FXML private TableColumn<String[], String> lbPHRankCol;
    @FXML private TableColumn<String[], String> lbPHNameCol;
    @FXML private TableColumn<String[], String> lbPHSectionCol;
    @FXML private TableColumn<String[], String> lbPHValCol;

    @FXML private TableView<String[]> lbPeerHelpPtsTable;
    @FXML private TableColumn<String[], String> lbPHPtsRankCol;
    @FXML private TableColumn<String[], String> lbPHPtsNameCol;
    @FXML private TableColumn<String[], String> lbPHPtsSectionCol;
    @FXML private TableColumn<String[], String> lbPHPtsValCol;

    private Course course;
    private final AnalyticsDAO analyticsDAO = new AnalyticsDAO();
    private final MongoSyncService mongoSyncService = new MongoSyncService();
    private String currentSection = null;

    @FXML
    private void initialize() {
        bindColumns(funnelTable, funnelModuleCol, 0, funnelStudentsCol, 1);
        bindColumns(taskPassTable, taskNameCol, 0, taskPassRateCol, 1);
        bindLeaderboard(lbTasksTable, lbTasksRankCol, lbTasksNameCol, lbTasksSectionCol, lbTasksValCol);
        bindLeaderboard(lbPerfectTasksTable, lbPTRankCol, lbPTNameCol, lbPTSectionCol, lbPTValCol);
        bindLeaderboard(lbQuestionsTable, lbQRankCol, lbQNameCol, lbQSectionCol, lbQValCol);
        bindLeaderboard(lbPerfectQTable, lbPQRankCol, lbPQNameCol, lbPQSectionCol, lbPQValCol);
        bindLeaderboard(lbPointsTable, lbPtsRankCol, lbPtsNameCol, lbPtsSectionCol, lbPtsValCol);
        bindLeaderboard(lbPeerHelpsTable, lbPHRankCol, lbPHNameCol, lbPHSectionCol, lbPHValCol);
        bindLeaderboard(lbPeerHelpPtsTable, lbPHPtsRankCol, lbPHPtsNameCol, lbPHPtsSectionCol, lbPHPtsValCol);
    }

    public void setCourse(Course course) {
        this.course = course;
        titleLabel.setText("Analytics — " + course.getCourseName());
        loadSections();
        loadData();
    }

    @FXML
    private void handleSectionFilter() {
        String selected = sectionCombo.getValue();
        currentSection = (selected == null || selected.equals("All Sections")) ? null : selected;
        loadData();
    }

    @FXML
    private void handleClearFilter() {
        sectionCombo.setValue(null);
        currentSection = null;
        loadData();
    }

    @FXML
    private void handleSyncData() {
        syncButton.setDisable(true);
        syncButton.setText("Syncing…");

        Task<Void> task = new Task<Void>() {
            @Override
            protected Void call() throws Exception {
                mongoSyncService.syncCourse(course);
                return null;
            }

            @Override
            protected void succeeded() {
                Platform.runLater(() -> {
                    syncButton.setDisable(false);
                    syncButton.setText("☁ Sync Data");
                    new Alert(Alert.AlertType.INFORMATION,
                            "Analytics for \"" + course.getCourseName() + "\" synced to MongoDB successfully.")
                            .showAndWait();
                });
            }

            @Override
            protected void failed() {
                Platform.runLater(() -> {
                    syncButton.setDisable(false);
                    syncButton.setText("☁ Sync Data");
                    new Alert(Alert.AlertType.ERROR,
                            "Sync failed: " + getException().getMessage())
                            .showAndWait();
                });
            }
        };
        new Thread(task).start();
    }

    @FXML
    private void handleClose() {
        ((Stage) titleLabel.getScene().getWindow()).close();
    }

    // -------------------------------------------------------------------------

    private void loadSections() {
        Task<List<String>> task = new Task<List<String>>() {
            @Override
            protected List<String> call() throws Exception {
                return analyticsDAO.getDistinctSections(course.getId());
            }
        };
        task.setOnSucceeded(e -> {
            List<String> sections = new ArrayList<>();
            sections.add("All Sections");
            sections.addAll(task.getValue());
            sectionCombo.setItems(FXCollections.observableArrayList(sections));
        });
        new Thread(task).start();
    }

    private void loadData() {
        long courseId = course.getId();
        String section = currentSection;

        Task<Void> task = new Task<Void>() {
            // analytics
            double avgTasks, avgModules, avgQuestions, avgPtsTask,
                   avgPtsModule, avgPtsQuestion, avgPtsCourse, avgAttempts, passRate;
            Map<String, Integer> funnel;
            Map<String, Double> taskRates;
            // leaderboards
            List<String[]> lbTasks, lbPerfectTasks, lbQuestions, lbPerfectQ, lbPoints,
                           lbPeerHelps, lbPeerHelpPts;

            @Override
            protected Void call() throws Exception {
                avgTasks      = analyticsDAO.getAvgTasksCompleted(courseId);
                avgModules    = analyticsDAO.getAvgModulesCompleted(courseId);
                avgQuestions  = analyticsDAO.getAvgQuestionsCompleted(courseId);
                avgPtsTask    = analyticsDAO.getAvgPointsPerTask(courseId);
                avgPtsModule  = analyticsDAO.getAvgPointsPerModule(courseId);
                avgPtsQuestion= analyticsDAO.getAvgPointsPerQuestion(courseId);
                avgPtsCourse  = analyticsDAO.getAvgPointsInCourse(courseId);
                avgAttempts   = analyticsDAO.getAvgAttemptsPerTask(courseId);
                passRate      = analyticsDAO.getCourseTestPassRate(courseId);
                funnel        = analyticsDAO.getModuleFunnel(courseId);
                taskRates     = analyticsDAO.getTaskPassRates(courseId);
                lbTasks       = analyticsDAO.getLeaderboardTasksCompleted(courseId, section);
                lbPerfectTasks= analyticsDAO.getLeaderboardPerfectTasks(courseId, section);
                lbQuestions   = analyticsDAO.getLeaderboardQuestionsCompleted(courseId, section);
                lbPerfectQ    = analyticsDAO.getLeaderboardPerfectQuestions(courseId, section);
                lbPoints      = analyticsDAO.getLeaderboardMostPoints(courseId, section);
                lbPeerHelps   = analyticsDAO.getLeaderboardMostPeerHelps(courseId, section);
                lbPeerHelpPts = analyticsDAO.getLeaderboardMostPeerHelpPoints(courseId, section);
                return null;
            }

            @Override
            protected void succeeded() {
                Platform.runLater(() -> {
                    avgTasksLabel.setText(fmt(avgTasks));
                    avgModulesLabel.setText(fmt(avgModules));
                    avgQuestionsLabel.setText(fmt(avgQuestions));
                    avgPtsTaskLabel.setText(fmt(avgPtsTask));
                    avgPtsModuleLabel.setText(fmt(avgPtsModule));
                    avgPtsQuestionLabel.setText(fmt(avgPtsQuestion));
                    avgPtsCourseLabel.setText(fmt(avgPtsCourse));
                    avgAttemptsLabel.setText(fmt(avgAttempts));
                    courseTestPassRateLabel.setText(fmt(passRate) + "%");

                    // Funnel
                    ObservableList<String[]> funnelRows = FXCollections.observableArrayList();
                    funnel.forEach((k, v) -> funnelRows.add(new String[]{k, String.valueOf(v)}));
                    funnelTable.setItems(funnelRows);

                    // Task pass rates
                    ObservableList<String[]> rateRows = FXCollections.observableArrayList();
                    taskRates.forEach((k, v) -> rateRows.add(new String[]{k, v + "%"}));
                    taskPassTable.setItems(rateRows);

                    // Leaderboards
                    lbTasksTable.setItems(FXCollections.observableArrayList(lbTasks));
                    lbPerfectTasksTable.setItems(FXCollections.observableArrayList(lbPerfectTasks));
                    lbQuestionsTable.setItems(FXCollections.observableArrayList(lbQuestions));
                    lbPerfectQTable.setItems(FXCollections.observableArrayList(lbPerfectQ));
                    lbPointsTable.setItems(FXCollections.observableArrayList(lbPoints));
                    lbPeerHelpsTable.setItems(FXCollections.observableArrayList(lbPeerHelps));
                    lbPeerHelpPtsTable.setItems(FXCollections.observableArrayList(lbPeerHelpPts));
                });
            }

            @Override
            protected void failed() {
                Platform.runLater(() ->
                    new Alert(Alert.AlertType.ERROR, "Failed to load analytics: " + getException().getMessage())
                        .showAndWait());
            }
        };
        new Thread(task).start();
    }

    // -------------------------------------------------------------------------
    // Helpers
    // -------------------------------------------------------------------------

    private String fmt(double v) {
        return v == 0.0 ? "0" : String.format("%.1f", v);
    }

    /** Bind a 2-column String[] table */
    private void bindColumns(TableView<String[]> table,
                             TableColumn<String[], String> col0, int i0,
                             TableColumn<String[], String> col1, int i1) {
        col0.setCellValueFactory(c -> new SimpleStringProperty(c.getValue()[i0]));
        col1.setCellValueFactory(c -> new SimpleStringProperty(c.getValue()[i1]));
    }

    /** Bind a 4-column leaderboard String[] table: rank, name, section, value */
    private void bindLeaderboard(TableView<String[]> table,
                                 TableColumn<String[], String> rank,
                                 TableColumn<String[], String> name,
                                 TableColumn<String[], String> section,
                                 TableColumn<String[], String> value) {
        rank.setCellValueFactory(c    -> new SimpleStringProperty(c.getValue()[0]));
        name.setCellValueFactory(c    -> new SimpleStringProperty(c.getValue()[1]));
        section.setCellValueFactory(c -> new SimpleStringProperty(c.getValue()[2]));
        value.setCellValueFactory(c   -> new SimpleStringProperty(c.getValue()[3]));
    }
}
