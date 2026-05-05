-- Migration: Course Shop feature
-- Adds course_shop_items and student_shop_purchases tables.
-- Points are NEVER deducted — spending is tracked separately.

USE samvidya;

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. course_shop_items
--    Items defined by instructor per course.
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS course_shop_items (
    id                   BIGINT PRIMARY KEY AUTO_INCREMENT,
    course_id            BIGINT NOT NULL,
    name                 VARCHAR(100) NOT NULL,
    description          TEXT,
    point_cost           INT NOT NULL DEFAULT 1 COMMENT 'Points required to purchase one unit',
    max_qty_per_student  INT NOT NULL DEFAULT 10 COMMENT 'Max units a single student can buy',
    is_active            BOOLEAN NOT NULL DEFAULT TRUE,
    created_at           TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at           TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE
);

CREATE INDEX idx_shop_items_course ON course_shop_items(course_id, is_active);

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. student_shop_purchases
--    One row per purchase event. Points are never deducted from any points column.
--    Spending is derived by SUM(points_spent) for a student+course.
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS student_shop_purchases (
    id           BIGINT PRIMARY KEY AUTO_INCREMENT,
    student_id   BIGINT NOT NULL,
    course_id    BIGINT NOT NULL,
    item_id      BIGINT NOT NULL,
    quantity     INT NOT NULL DEFAULT 1,
    points_spent INT NOT NULL COMMENT 'point_cost * quantity at time of purchase',
    purchased_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (course_id)  REFERENCES courses(id) ON DELETE CASCADE,
    FOREIGN KEY (item_id)    REFERENCES course_shop_items(id) ON DELETE CASCADE
);

CREATE INDEX idx_shop_purchases_student_course ON student_shop_purchases(student_id, course_id);
CREATE INDEX idx_shop_purchases_item           ON student_shop_purchases(item_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- 3. Seed default "1 Mark" item for every existing course
-- ─────────────────────────────────────────────────────────────────────────────
INSERT INTO course_shop_items (course_id, name, description, point_cost, max_qty_per_student, is_active)
SELECT id,
       '1 Mark',
       'Redeem 5 course points for 1 mark of extra credit. Max 10 per student.',
       5,
       10,
       TRUE
FROM courses;

SELECT 'Migration mig_shop.sql completed successfully.' AS status;
