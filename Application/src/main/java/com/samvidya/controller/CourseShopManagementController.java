package com.samvidya.controller;

import com.samvidya.dao.ShopDAO;
import com.samvidya.model.Course;
import com.samvidya.model.ShopItem;
import javafx.beans.property.SimpleBooleanProperty;
import javafx.beans.property.SimpleIntegerProperty;
import javafx.beans.property.SimpleStringProperty;
import javafx.collections.FXCollections;
import javafx.collections.ObservableList;
import javafx.fxml.FXML;
import javafx.scene.control.*;
import javafx.stage.Stage;

import java.util.List;

public class CourseShopManagementController {

    @FXML private Label titleLabel;
    @FXML private TextField nameField;
    @FXML private TextArea descField;
    @FXML private Spinner<Integer> costSpinner;
    @FXML private Spinner<Integer> maxQtySpinner;
    @FXML private CheckBox activeCheck;
    @FXML private Button deleteItemButton;
    @FXML private Label formErrorLabel;

    // Items table
    @FXML private TableView<ShopItem> itemsTable;
    @FXML private TableColumn<ShopItem, String>  itemNameCol;
    @FXML private TableColumn<ShopItem, String>  itemDescCol;
    @FXML private TableColumn<ShopItem, Integer> itemCostCol;
    @FXML private TableColumn<ShopItem, Integer> itemMaxQtyCol;
    @FXML private TableColumn<ShopItem, Boolean> itemActiveCol;

    // Summary table
    @FXML private TableView<String[]> summaryTable;
    @FXML private TableColumn<String[], String> sumItemCol;
    @FXML private TableColumn<String[], String> sumQtyCol;
    @FXML private TableColumn<String[], String> sumPtsCol;

    private Course course;
    private final ShopDAO shopDAO = new ShopDAO();
    private final ObservableList<ShopItem> itemsList = FXCollections.observableArrayList();
    private ShopItem editingItem = null;

    @FXML
    private void initialize() {
        // Items table columns
        itemNameCol.setCellValueFactory(c -> new SimpleStringProperty(c.getValue().getName()));
        itemDescCol.setCellValueFactory(c -> new SimpleStringProperty(c.getValue().getDescription()));
        itemCostCol.setCellValueFactory(c -> new SimpleIntegerProperty(c.getValue().getPointCost()).asObject());
        itemMaxQtyCol.setCellValueFactory(c -> new SimpleIntegerProperty(c.getValue().getMaxQtyPerStudent()).asObject());
        itemActiveCol.setCellValueFactory(c -> new SimpleBooleanProperty(c.getValue().isActive()).asObject());
        itemActiveCol.setCellFactory(col -> new TableCell<ShopItem, Boolean>() {
            @Override protected void updateItem(Boolean v, boolean empty) {
                super.updateItem(v, empty);
                setText(empty || v == null ? null : (v ? "Yes" : "No"));
                setStyle(empty || v == null ? "" : (v ? "-fx-text-fill: #2E7D32;" : "-fx-text-fill: #c62828;"));
            }
        });
        itemsTable.setItems(itemsList);

        // Row click → populate form
        itemsTable.getSelectionModel().selectedItemProperty().addListener((obs, o, n) -> {
            deleteItemButton.setDisable(n == null);
            if (n != null) populateForm(n);
        });

        // Summary table columns
        sumItemCol.setCellValueFactory(c -> new SimpleStringProperty(c.getValue()[0]));
        sumQtyCol.setCellValueFactory(c -> new SimpleStringProperty(c.getValue()[1]));
        sumPtsCol.setCellValueFactory(c -> new SimpleStringProperty(c.getValue()[2]));

        // Spinner factories
        costSpinner.setValueFactory(new SpinnerValueFactory.IntegerSpinnerValueFactory(1, 9999, 5));
        maxQtySpinner.setValueFactory(new SpinnerValueFactory.IntegerSpinnerValueFactory(1, 999, 10));
    }

    public void setCourse(Course course) {
        this.course = course;
        titleLabel.setText("Shop — " + course.getCourseName());
        loadItems();
        loadSummary();
    }

    // ── Form ─────────────────────────────────────────────────────────────────

    @FXML
    private void handleSaveItem() {
        String name = nameField.getText().trim();
        if (name.isEmpty()) { showFormError("Name is required."); return; }

        ShopItem item = editingItem != null ? editingItem : new ShopItem();
        item.setCourseId(course.getId());
        item.setName(name);
        item.setDescription(descField.getText().trim());
        item.setPointCost(costSpinner.getValue());
        item.setMaxQtyPerStudent(maxQtySpinner.getValue());
        item.setActive(activeCheck.isSelected());

        try {
            shopDAO.saveItem(item);
            handleClearForm();
            loadItems();
            loadSummary();
        } catch (Exception e) {
            showFormError("Save failed: " + e.getMessage());
        }
    }

    @FXML
    private void handleDeleteItem() {
        ShopItem selected = itemsTable.getSelectionModel().getSelectedItem();
        if (selected == null) return;
        Alert confirm = new Alert(Alert.AlertType.CONFIRMATION,
            "Delete \"" + selected.getName() + "\"? This cannot be undone.", ButtonType.YES, ButtonType.NO);
        confirm.setHeaderText(null);
        if (confirm.showAndWait().orElse(ButtonType.NO) != ButtonType.YES) return;
        try {
            shopDAO.deleteItem(selected.getId());
            handleClearForm();
            loadItems();
            loadSummary();
        } catch (Exception e) {
            showFormError("Delete failed: " + e.getMessage());
        }
    }

    @FXML
    private void handleClearForm() {
        editingItem = null;
        nameField.clear();
        descField.clear();
        costSpinner.getValueFactory().setValue(5);
        maxQtySpinner.getValueFactory().setValue(10);
        activeCheck.setSelected(true);
        formErrorLabel.setVisible(false);
        itemsTable.getSelectionModel().clearSelection();
        deleteItemButton.setDisable(true);
    }

    @FXML
    private void handleClose() {
        ((Stage) titleLabel.getScene().getWindow()).close();
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private void loadItems() {
        try {
            List<ShopItem> items = shopDAO.findItemsByCourse(course.getId());
            itemsList.setAll(items);
        } catch (Exception e) {
            showFormError("Failed to load items: " + e.getMessage());
        }
    }

    private void loadSummary() {
        try {
            List<String[]> rows = shopDAO.getItemSummaryForCourse(course.getId());
            summaryTable.setItems(FXCollections.observableArrayList(rows));
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    private void populateForm(ShopItem item) {
        editingItem = item;
        nameField.setText(item.getName());
        descField.setText(item.getDescription() != null ? item.getDescription() : "");
        costSpinner.getValueFactory().setValue(item.getPointCost());
        maxQtySpinner.getValueFactory().setValue(item.getMaxQtyPerStudent());
        activeCheck.setSelected(item.isActive());
        formErrorLabel.setVisible(false);
    }

    private void showFormError(String msg) {
        formErrorLabel.setText(msg);
        formErrorLabel.setVisible(true);
    }
}
