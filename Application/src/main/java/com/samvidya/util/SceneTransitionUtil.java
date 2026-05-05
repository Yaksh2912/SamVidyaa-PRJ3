package com.samvidya.util;

import javafx.animation.FadeTransition;
import javafx.animation.ScaleTransition;
import javafx.animation.SequentialTransition;
import javafx.application.Platform;
import javafx.fxml.FXMLLoader;
import javafx.scene.Parent;
import javafx.scene.Scene;
import javafx.stage.Stage;
import javafx.util.Duration;

/**
 * Utility class for smooth scene transitions inspired by PrashnaSetu's SceneTransitionService
 */
public class SceneTransitionUtil {
    
    public enum TransitionType {
        FADE,
        FADE_SCALE,
        SLIDE_RIGHT,
        SLIDE_LEFT,
        SLIDE_UP
    }
    
    /**
     * Transition to a new scene with smooth animation
     */
    public static void transitionTo(Stage stage, String fxmlPath, String title, TransitionType transitionType) {
        transitionTo(stage, fxmlPath, title, transitionType, null);
    }
    
    /**
     * Transition to a new scene with smooth animation using pre-loaded Parent
     */
    public static void transitionTo(Stage stage, Parent newRoot, String title, TransitionType transitionType) {
        try {
            // Create scene sized to the current stage so StackPane fills it immediately
            Scene newScene = new Scene(newRoot, stage.getWidth(), stage.getHeight());
            newScene.getStylesheets().add(SceneTransitionUtil.class.getResource("/css/style.css").toExternalForm());
            
            // Apply transition
            applyTransition(stage, newScene, title, transitionType);
            
        } catch (Exception e) {
            e.printStackTrace();
            Scene scene = new Scene(newRoot, stage.getWidth(), stage.getHeight());
            scene.getStylesheets().add(SceneTransitionUtil.class.getResource("/css/style.css").toExternalForm());
            stage.setScene(scene);
            stage.setTitle(title);
            stage.centerOnScreen();
        }
    }
    
    /**
     * Transition to a new scene with smooth animation and controller setup
     */
    public static void transitionTo(Stage stage, String fxmlPath, String title, TransitionType transitionType, 
                                   ControllerSetup controllerSetup) {
        try {
            // Load new scene
            FXMLLoader loader = new FXMLLoader(SceneTransitionUtil.class.getResource(fxmlPath));
            Parent newRoot = loader.load();
            
            // Setup controller if provided
            if (controllerSetup != null) {
                controllerSetup.setup(loader.getController());
            }
            
            // Create scene sized to the current stage so StackPane fills it immediately
            Scene newScene = new Scene(newRoot, stage.getWidth(), stage.getHeight());
            newScene.getStylesheets().add(SceneTransitionUtil.class.getResource("/css/style.css").toExternalForm());
            
            // Apply transition
            applyTransition(stage, newScene, title, transitionType);
            
        } catch (Exception e) {
            e.printStackTrace();
            try {
                FXMLLoader loader = new FXMLLoader(SceneTransitionUtil.class.getResource(fxmlPath));
                Parent root = loader.load();
                
                if (controllerSetup != null) {
                    controllerSetup.setup(loader.getController());
                }
                
                Scene scene = new Scene(root, stage.getWidth(), stage.getHeight());
                scene.getStylesheets().add(SceneTransitionUtil.class.getResource("/css/style.css").toExternalForm());
                stage.setScene(scene);
                stage.setTitle(title);
                stage.centerOnScreen();
            } catch (Exception fallbackException) {
                fallbackException.printStackTrace();
            }
        }
    }
    
    private static void applyTransition(Stage stage, Scene newScene, String title, TransitionType transitionType) {
        switch (transitionType) {
            case FADE:
                fadeTransition(stage, newScene, title);
                break;
            case FADE_SCALE:
                fadeScaleTransition(stage, newScene, title);
                break;
            case SLIDE_RIGHT:
            case SLIDE_LEFT:
            case SLIDE_UP:
                slideTransition(stage, newScene, title, transitionType);
                break;
            default:
                // No animation, direct transition
                stage.setScene(newScene);
                stage.setTitle(title);
                stage.centerOnScreen();
        }
    }
    
    private static void fadeTransition(Stage stage, Scene newScene, String title) {
        Parent currentRoot = stage.getScene().getRoot();
        
        FadeTransition fadeOut = new FadeTransition(Duration.millis(200), currentRoot);
        fadeOut.setFromValue(1.0);
        fadeOut.setToValue(0.0);
        
        fadeOut.setOnFinished(e -> {
            stage.setScene(newScene);
            stage.setTitle(title);
            stage.centerOnScreen();
            
            FadeTransition fadeIn = new FadeTransition(Duration.millis(200), newScene.getRoot());
            fadeIn.setFromValue(0.0);
            fadeIn.setToValue(1.0);
            fadeIn.play();
        });
        
        fadeOut.play();
    }
    
    private static void fadeScaleTransition(Stage stage, Scene newScene, String title) {
        Parent currentRoot = stage.getScene().getRoot();
        
        FadeTransition fadeOut = new FadeTransition(Duration.millis(150), currentRoot);
        fadeOut.setFromValue(1.0);
        fadeOut.setToValue(0.0);
        
        ScaleTransition scaleOut = new ScaleTransition(Duration.millis(150), currentRoot);
        scaleOut.setFromX(1.0);
        scaleOut.setFromY(1.0);
        scaleOut.setToX(0.8);
        scaleOut.setToY(0.8);
        
        SequentialTransition outTransition = new SequentialTransition(fadeOut, scaleOut);
        
        outTransition.setOnFinished(e -> {
            stage.setScene(newScene);
            stage.setTitle(title);
            stage.centerOnScreen();
            
            Parent newRoot = newScene.getRoot();
            newRoot.setOpacity(0.0);
            newRoot.setScaleX(0.8);
            newRoot.setScaleY(0.8);
            
            FadeTransition fadeIn = new FadeTransition(Duration.millis(150), newRoot);
            fadeIn.setFromValue(0.0);
            fadeIn.setToValue(1.0);
            
            ScaleTransition scaleIn = new ScaleTransition(Duration.millis(150), newRoot);
            scaleIn.setFromX(0.8);
            scaleIn.setFromY(0.8);
            scaleIn.setToX(1.0);
            scaleIn.setToY(1.0);
            
            SequentialTransition inTransition = new SequentialTransition(fadeIn, scaleIn);
            inTransition.play();
        });
        
        outTransition.play();
    }
    
    private static void slideTransition(Stage stage, Scene newScene, String title, TransitionType direction) {
        // For now, implement as fade transition
        // Can be enhanced later with actual slide animations
        fadeTransition(stage, newScene, title);
    }
    
    /**
     * Interface for setting up controllers after loading
     */
    @FunctionalInterface
    public interface ControllerSetup {
        void setup(Object controller);
    }
}