package com.samvidya.controller;

import com.samvidya.dao.*;
import com.samvidya.model.*;
import com.samvidya.util.CodeExecutor;
import javafx.application.Platform;
import javafx.collections.FXCollections;
import javafx.collections.ObservableList;
import javafx.concurrent.Task;
import javafx.fxml.FXML;
import javafx.scene.control.*;
import javafx.scene.control.cell.PropertyValueFactory;
import javafx.stage.Stage;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Controller for the peer-help task screen (Student B solving on behalf of Student A).
 */
public class PeerHelpTaskController {

    @FXML private Label taskNameLabel;
    @FXML private Label difficultyLabel;
    @FXML private Label pointsLabel;
    @FXML private Label languageLabel;
    @FXML private Label helpingLabel;
    @FXML private TextArea problemStatementArea;
    @FXML private TableView<TestCase> sampleTestCasesTable;
    @FXML private TableColumn<TestCase, String> sampleInputColumn;
    @FXML private TableColumn<TestCase, String> sampleOutputColumn;
    @FXML private TextArea codeArea;
    @FXML private Button runCodeButton;
    @FXML private Button submitCodeButton;
    @FXML private TextArea outputArea;
    @FXML private Label statusLabel;
    @FXML private ProgressBar executionProgress;

    private User helperUser;           // Student B
    private PeerHelpRequest request;
    private com.samvidya.model.Task task;
    private com.samvidya.model.Module module;
    private Course course;
    private User requesterUser;        // Student A

    private final TestCaseDAO testCaseDAO = new TestCaseDAO();
    private final StudentAttemptDAO studentAttemptDAO = new StudentAttemptDAO();
    private final StudentCourseProgressDAO courseProgressDAO = new StudentCourseProgressDAO();
    private final UserDAO userDAO = new UserDAO();
    private final PeerHelpDAO peerHelpDAO = new PeerHelpDAO();
    private final CodeExecutor codeExecutor = new CodeExecutor();
    private final ObservableList<TestCase> sampleTestCases = FXCollections.observableArrayList();

    @FXML
    private void initialize() {
        sampleInputColumn.setCellValueFactory(new PropertyValueFactory<>("input"));
        sampleOutputColumn.setCellValueFactory(new PropertyValueFactory<>("expectedOutput"));
        sampleTestCasesTable.setItems(sampleTestCases);
        problemStatementArea.setEditable(false);
        outputArea.setEditable(false);
        executionProgress.setVisible(false);
    }

    public void setup(User helper, PeerHelpRequest req, com.samvidya.model.Task task,
                      com.samvidya.model.Module module, Course course, User requester) {
        this.helperUser = helper;
        this.request = req;
        this.task = task;
        this.module = module;
        this.course = course;
        this.requesterUser = requester;

        taskNameLabel.setText(task.getTaskName());
        difficultyLabel.setText(task.getDifficulty());
        pointsLabel.setText(task.getPoints() + " pts");
        languageLabel.setText(task.getLanguage());
        helpingLabel.setText("Helping: " + requester.getFullName()
                + (requester.getEnrollmentNumber() != null ? " (" + requester.getEnrollmentNumber() + ")" : ""));
        problemStatementArea.setText(task.getProblemStatement());
        setCodeTemplate(task.getLanguage());

        try {
            List<TestCase> samples = testCaseDAO.findSampleTestCases(task.getId(), null);
            sampleTestCases.setAll(samples);
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    @FXML
    private void handleRunCode() {
        String code = codeArea.getText().trim();
        if (code.isEmpty()) { statusLabel.setText("Write some code first"); return; }
        runAsync(code, true);
    }

    @FXML
    private void handleSubmit() {
        String code = codeArea.getText().trim();
        if (code.isEmpty()) { statusLabel.setText("Write some code first"); return; }

        Alert confirm = new Alert(Alert.AlertType.CONFIRMATION,
            "Submit this solution on behalf of " + requesterUser.getFullName() + "?\n" +
            "Points earned will be split 50/50 between you and them.",
            ButtonType.OK, ButtonType.CANCEL);
        confirm.setTitle("Confirm Peer Help Submission");
        confirm.setHeaderText(null);
        if (confirm.showAndWait().orElse(ButtonType.CANCEL) != ButtonType.OK) return;

        runAsync(code, false);
    }

    @FXML
    private void handleCancel() {
        try {
            peerHelpDAO.updateStatus(request.getId(), "REJECTED");
        } catch (Exception e) {
            e.printStackTrace();
        }
        close();
    }

    // ─────────────────────────────────────────────────────────────────────────

    private void runAsync(String code, boolean sampleOnly) {
        runCodeButton.setDisable(true);
        submitCodeButton.setDisable(true);
        executionProgress.setVisible(true);
        statusLabel.setText(sampleOnly ? "Running samples..." : "Evaluating...");
        outputArea.clear();

        Task<CodeExecutor.TestExecutionResult> execTask = new Task<CodeExecutor.TestExecutionResult>() {
            @Override
            protected CodeExecutor.TestExecutionResult call() throws Exception {
                List<TestCase> cases = sampleOnly
                    ? testCaseDAO.findSampleTestCases(task.getId(), null)
                    : testCaseDAO.findByTaskId(task.getId());
                return codeExecutor.executeWithTestCases(code, task.getLanguage(), cases);
            }
        };

        execTask.setOnSucceeded(e -> Platform.runLater(() -> {
            CodeExecutor.TestExecutionResult result = execTask.getValue();
            displayResult(result, sampleOnly);
            if (!sampleOnly) saveAndDistributePoints(code, result);
            runCodeButton.setDisable(false);
            submitCodeButton.setDisable(false);
            executionProgress.setVisible(false);
        }));

        execTask.setOnFailed(e -> Platform.runLater(() -> {
            statusLabel.setText("Execution failed: " + execTask.getException().getMessage());
            runCodeButton.setDisable(false);
            submitCodeButton.setDisable(false);
            executionProgress.setVisible(false);
        }));

        new Thread(execTask).start();
    }

    private void displayResult(CodeExecutor.TestExecutionResult result, boolean sampleOnly) {
        StringBuilder sb = new StringBuilder();
        if (!sampleOnly) {
            int pts = calcScore(result);
            sb.append(String.format("Score: %d/%d\n\n", pts, task.getPoints()));
        }
        for (CodeExecutor.TestCaseResult tr : result.getTestCaseResults()) {
            if (sampleOnly && !tr.getTestCase().isSample()) continue;
            sb.append(String.format("Test %d: %s\n", tr.getTestCase().getOrderIndex(),
                    tr.isPassed() ? "PASSED" : "FAILED"));
            if (tr.getTestCase().isSample()) {
                sb.append("  Input: ").append(tr.getTestCase().getInput()).append("\n");
                sb.append("  Expected: ").append(tr.getTestCase().getExpectedOutput()).append("\n");
                sb.append("  Actual: ").append(tr.getExecutionResult().getOutput().trim()).append("\n");
            }
            sb.append("\n");
        }
        outputArea.setText(sb.toString());
        statusLabel.setText(sampleOnly ? "Sample run done" : "Submitted");
    }

    private void saveAndDistributePoints(String code, CodeExecutor.TestExecutionResult result) {
        try {
            int taskPoints = task.getPoints();
            int earned = calcScore(result);

            // 50/50 split
            int helperPts = earned / 2;
            int helpedPts = earned - helperPts; // ceil for the helped student

            // ── Student A (requester) ──────────────────────────────────────
            // Score is capped: peer-helped score cannot be beaten by future self-attempts
            // We save the attempt flagged as peer-helped so the cap is enforced later.
            StudentAttempt prevA = studentAttemptDAO.findLatestAttemptByStudentAndTask(
                    requesterUser.getId(), task.getId());
            int prevScoreA = prevA != null ? prevA.getScore() : 0;
            // For peer-helped: only award if it's better than what they already had
            int scoreForA = Math.max(helpedPts, prevScoreA);
            int pointsToAddA = Math.max(0, scoreForA - prevScoreA);

            StudentAttempt attemptA = buildAttempt(
                requesterUser.getId(), code, earned, taskPoints, scoreForA,
                true, request.getId());
            studentAttemptDAO.save(attemptA);
            courseProgressDAO.updateCoursePoints(requesterUser.getId(), course.getId());
            if (pointsToAddA > 0) userDAO.addPoints(requesterUser.getId(), pointsToAddA);

            // ── Student B (helper) ────────────────────────────────────────
            // Points go to global pool AND course points (via incrementHelperStats)
            userDAO.addPoints(helperUser.getId(), helperPts);
            peerHelpDAO.incrementHelperStats(helperUser.getId(), course.getId(), helperPts);

            // ── Audit record ──────────────────────────────────────────────
            PeerHelpRecord rec = new PeerHelpRecord();
            rec.setRequestId(request.getId());
            rec.setHelperId(helperUser.getId());
            rec.setHelpedStudentId(requesterUser.getId());
            rec.setCourseId(course.getId());
            rec.setTaskId(task.getId());
            rec.setPointsEarned(earned);
            rec.setHelperPoints(helperPts);
            rec.setHelpedPoints(helpedPts);
            peerHelpDAO.createRecord(rec);

            peerHelpDAO.updateStatus(request.getId(), "COMPLETED");

            final int finalEarned = earned;
            final int finalHelperPts = helperPts;
            final int finalHelpedPts = helpedPts;
            Platform.runLater(() -> {
                Alert done = new Alert(Alert.AlertType.INFORMATION,
                    String.format("Submission complete!\n\nScore: %d/%d\nYou earned: %d pts\n%s earned: %d pts",
                        finalEarned, taskPoints, finalHelperPts,
                        requesterUser.getFullName(), finalHelpedPts));
                done.setTitle("Peer Help Complete");
                done.setHeaderText(null);
                done.showAndWait();
                close();
            });

        } catch (Exception e) {
            e.printStackTrace();
            Platform.runLater(() -> statusLabel.setText("Failed to save: " + e.getMessage()));
        }
    }

    private int calcScore(CodeExecutor.TestExecutionResult result) {
        int execScore = result.getTotalScore();
        int execMax = result.getMaxScore();
        if (execMax <= 0) return 0;
        return (int) Math.round((double) execScore / execMax * task.getPoints());
    }

    private StudentAttempt buildAttempt(long studentId, String code, int rawEarned, int maxPts,
                                        int bestScore, boolean peerHelped, Long requestId) {
        StudentAttempt a = new StudentAttempt();
        a.setStudentId(studentId);
        a.setTaskId(task.getId());
        a.setModuleId(module.getId());
        a.setCourseId(course.getId());
        a.setAttemptType("TASK");
        a.setSubmittedCode(code);
        a.setExecutionResult("Peer help submission. Score: " + rawEarned + "/" + maxPts);
        a.setCorrect(bestScore >= maxPts * 0.5);
        a.setScore(bestScore);
        a.setMaxScore(maxPts);
        a.setAttemptNumber(1);
        a.setStatus("COMPLETED");
        a.setPeerHelped(peerHelped);
        a.setPeerHelpRequestId(requestId);
        a.setSubmittedAt(LocalDateTime.now());
        a.setCompletedAt(LocalDateTime.now());
        a.setLatest(true);
        return a;
    }

    private void setCodeTemplate(String language) {
        switch (language.toLowerCase()) {
            case "python": codeArea.setText("# Write your Python solution here\n\n"); break;
            case "java":   codeArea.setText("public class Solution {\n    public static void main(String[] args) {\n        \n    }\n}\n"); break;
            default:       codeArea.setText("// Write your solution here\n\n"); break;
        }
    }

    private void close() {
        ((Stage) taskNameLabel.getScene().getWindow()).close();
    }
}
