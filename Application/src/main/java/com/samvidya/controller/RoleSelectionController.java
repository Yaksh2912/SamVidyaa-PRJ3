package com.samvidya.controller;

import com.samvidya.util.SceneTransitionUtil;
import javafx.fxml.FXML;
import javafx.scene.control.Button;
import javafx.scene.layout.VBox;
import javafx.stage.Screen;
import javafx.stage.Stage;

public class RoleSelectionController {

    @FXML
    private Button instructorButton;

    @FXML
    private Button studentButton;

    @FXML
    private VBox rootContainer;

    @FXML
    private void initialize() {
        // Set the root container height to 95% of screen height, capped at 700px
        Screen screen = Screen.getPrimary();
        double screenHeight = screen.getVisualBounds().getHeight() * 0.95;
        screenHeight = Math.min(screenHeight, 700.0); // Cap at 700px
        if (rootContainer != null) {
            rootContainer.setPrefHeight(screenHeight);
            rootContainer.setMinHeight(screenHeight);
            rootContainer.setMaxHeight(700.0);
        }
    }

    @FXML
    private void handleStudentSelection() {
        openLogin("STUDENT", "SamVidya - Student Login", SceneTransitionUtil.TransitionType.SLIDE_RIGHT);
    }

    @FXML
    private void handleInstructorSelection() {
        openLogin("INSTRUCTOR", "SamVidya - Instructor / Admin Login", SceneTransitionUtil.TransitionType.FADE_SCALE);
    }

    private void openLogin(String role, String title, SceneTransitionUtil.TransitionType transition) {
        Stage stage = (Stage) studentButton.getScene().getWindow();

        Screen screen = Screen.getPrimary();
        double w = screen.getVisualBounds().getWidth() * 0.5;
        double h = screen.getVisualBounds().getHeight() * 0.9;

        // Set size BEFORE loading the scene so the StackPane gets correct dimensions on
        // first layout
        stage.setWidth(w);
        stage.setHeight(h);
        stage.centerOnScreen();

        SceneTransitionUtil.transitionTo(
                stage,
                "/fxml/Login.fxml",
                title,
                transition,
                controller -> {
                    if (controller instanceof LoginController) {
                        ((LoginController) controller).setUserRole(role);
                    }
                });
    }
}