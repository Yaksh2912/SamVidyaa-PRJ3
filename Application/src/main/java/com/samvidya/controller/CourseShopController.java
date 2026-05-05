package com.samvidya.controller;

import com.samvidya.dao.ShopDAO;
import com.samvidya.dao.StudentCourseProgressDAO;
import com.samvidya.model.*;
import javafx.beans.property.SimpleIntegerProperty;
import javafx.beans.property.SimpleStringProperty;
import javafx.collections.FXCollections;
import javafx.collections.ObservableList;
import javafx.fxml.FXML;
import javafx.scene.control.*;
import javafx.stage.Stage;

import java.time.format.DateTimeFormatter;
import java.util.List;

public class CourseShopController {

    @FXML private Label titleLabel;
    @FXML private Label pointsSummaryLabel;
    @FXML private Label shopErrorLabel;

    // Shop table
    @FXML private TableView<ShopItem> shopTable;
    @FXML private TableColumn<ShopItem, String>  shopNameCol;
    @FXML private TableColumn<ShopItem, String>  shopDescCol;
    @FXML private TableColumn<ShopItem, Integer> shopCostCol;
    @FXML private TableColumn<ShopItem, Integer> shopMaxCol;
    @FXML private TableColumn<ShopItem, Integer> shopOwnedCol;
    @FXML private TableColumn<ShopItem, Void>    shopBuyCol;

    // History table
    @FXML private TableView<ShopPurchase> historyTable;
    @FXML private TableColumn<ShopPurchase, String> histItemCol;
    @FXML private TableColumn<ShopPurchase, Integer> histQtyCol;
    @FXML private TableColumn<ShopPurchase, Integer> histPtsCol;
    @FXML private TableColumn<ShopPurchase, String>  histDateCol;

    private User currentUser;
    private Course course;
    private final ShopDAO shopDAO = new ShopDAO();
    private final StudentCourseProgressDAO progressDAO = new StudentCourseProgressDAO();
    private final ObservableList<ShopItem> shopItems = FXCollections.observableArrayList();
    private final ObservableList<ShopPurchase> history = FXCollections.observableArrayList();

    private int earnedPoints = 0;
    private int spentPoints = 0;

    @FXML
    private void initialize() {
        // Shop table
        shopNameCol.setCellValueFactory(c -> new SimpleStringProperty(c.getValue().getName()));
        shopDescCol.setCellValueFactory(c -> new SimpleStringProperty(c.getValue().getDescription()));
        shopCostCol.setCellValueFactory(c -> new SimpleIntegerProperty(c.getValue().getPointCost()).asObject());
        shopMaxCol.setCellValueFactory(c -> new SimpleIntegerProperty(c.getValue().getMaxQtyPerStudent()).asObject());

        shopOwnedCol.setCellValueFactory(c -> {
            try {
                int owned = shopDAO.getStudentItemQty(currentUser.getId(), c.getValue().getId());
                return new SimpleIntegerProperty(owned).asObject();
            } catch (Exception e) {
                return new SimpleIntegerProperty(0).asObject();
            }
        });

        shopBuyCol.setCellFactory(col -> new TableCell<ShopItem, Void>() {
            private final Button btn = new Button("Buy");
            {
                btn.setStyle("-fx-background-color: #1565C0; -fx-text-fill: white; -fx-background-radius: 4; -fx-padding: 3 10;");
                btn.setOnAction(e -> {
                    ShopItem item = getTableView().getItems().get(getIndex());
                    handleBuy(item);
                });
            }
            @Override protected void updateItem(Void v, boolean empty) {
                super.updateItem(v, empty);
                if (empty) { setGraphic(null); return; }
                ShopItem item = getTableView().getItems().get(getIndex());
                try {
                    int owned = shopDAO.getStudentItemQty(currentUser.getId(), item.getId());
                    int available = earnedPoints - spentPoints;
                    boolean canBuy = owned < item.getMaxQtyPerStudent() && available >= item.getPointCost();
                    btn.setDisable(!canBuy);
                } catch (Exception ex) {
                    btn.setDisable(true);
                }
                setGraphic(btn);
            }
        });

        shopTable.setItems(shopItems);

        // History table
        histItemCol.setCellValueFactory(c -> new SimpleStringProperty(c.getValue().getItemName()));
        histQtyCol.setCellValueFactory(c -> new SimpleIntegerProperty(c.getValue().getQuantity()).asObject());
        histPtsCol.setCellValueFactory(c -> new SimpleIntegerProperty(c.getValue().getPointsSpent()).asObject());
        histDateCol.setCellValueFactory(c -> {
            if (c.getValue().getPurchasedAt() == null) return new SimpleStringProperty("—");
            return new SimpleStringProperty(
                c.getValue().getPurchasedAt().format(DateTimeFormatter.ofPattern("MMM dd yyyy, HH:mm")));
        });
        historyTable.setItems(history);
    }

    public void setup(User user, Course course) {
        this.currentUser = user;
        this.course = course;
        titleLabel.setText("Shop — " + course.getCourseName());
        loadData();
    }

    // ── Buy ───────────────────────────────────────────────────────────────────

    private void handleBuy(ShopItem item) {
        try {
            int owned = shopDAO.getStudentItemQty(currentUser.getId(), item.getId());
            int available = earnedPoints - spentPoints;

            if (owned >= item.getMaxQtyPerStudent()) {
                showError("You have reached the maximum quantity for this item (" + item.getMaxQtyPerStudent() + ").");
                return;
            }
            if (available < item.getPointCost()) {
                showError("Not enough available points. You need " + item.getPointCost() +
                          " pts but only have " + available + " available.");
                return;
            }

            Alert confirm = new Alert(Alert.AlertType.CONFIRMATION,
                "Purchase \"" + item.getName() + "\" for " + item.getPointCost() + " pts?\n\n" +
                "Your points are not deducted — this is tracked as spending only.\n" +
                "After purchase: Spent " + (spentPoints + item.getPointCost()) + " / Earned " + earnedPoints + " pts.",
                ButtonType.YES, ButtonType.NO);
            confirm.setTitle("Confirm Purchase");
            confirm.setHeaderText(null);
            if (confirm.showAndWait().orElse(ButtonType.NO) != ButtonType.YES) return;

            shopDAO.purchase(currentUser.getId(), course.getId(), item.getId(), 1, item.getPointCost());
            loadData();

        } catch (Exception e) {
            showError("Purchase failed: " + e.getMessage());
        }
    }

    // ── Data ──────────────────────────────────────────────────────────────────

    private void loadData() {
        try {
            // Points
            StudentCourseProgress progress = progressDAO.findByStudentAndCourse(currentUser.getId(), course.getId());
            earnedPoints = progress != null ? progress.getTotalCoursePoints() : 0;
            spentPoints = shopDAO.getTotalPointsSpent(currentUser.getId(), course.getId());
            int available = earnedPoints - spentPoints;
            pointsSummaryLabel.setText(
                "Earned: " + earnedPoints + " pts  |  Spent: " + spentPoints + " pts  |  Available: " + available + " pts");

            // Shop items
            List<ShopItem> items = shopDAO.findActiveItemsByCourse(course.getId());
            shopItems.setAll(items);
            shopTable.refresh();

            // History
            List<ShopPurchase> purchases = shopDAO.getPurchaseHistory(currentUser.getId(), course.getId());
            history.setAll(purchases);

            shopErrorLabel.setVisible(false);
        } catch (Exception e) {
            showError("Failed to load shop: " + e.getMessage());
        }
    }

    @FXML
    private void handleClose() {
        ((Stage) titleLabel.getScene().getWindow()).close();
    }

    private void showError(String msg) {
        shopErrorLabel.setText(msg);
        shopErrorLabel.setVisible(true);
    }
}
