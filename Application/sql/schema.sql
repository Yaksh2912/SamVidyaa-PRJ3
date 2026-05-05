-- Create database and use it
CREATE DATABASE IF NOT EXISTS samvidya;
USE samvidya;

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(255), -- Plain password for initial seed, will be migrated to hash
    password_hash VARCHAR(255),
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    role ENUM('ADMIN', 'INSTRUCTOR', 'STUDENT') NOT NULL,
    institution VARCHAR(100),
    section VARCHAR(100) DEFAULT NULL,
    enrollment_number VARCHAR(50), -- For students
    total_points INT DEFAULT 0 COMMENT 'Cumulative points earned from tasks, module tests, and course tests. Only counts best scores, not duplicates.',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Courses table - Add course_test_questions back at course level since it's for final course test
CREATE TABLE IF NOT EXISTS courses (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    course_code VARCHAR(20) UNIQUE NOT NULL,
    course_name VARCHAR(255) NOT NULL,
    description TEXT,
    subject VARCHAR(100) NOT NULL, -- Python, C++, Java, DSA, etc.
    instructor_id BIGINT NOT NULL,
    instructor_name VARCHAR(100) NOT NULL,
    course_test_questions INT DEFAULT 5, -- Configurable number of questions in final course test
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (instructor_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Modules table
CREATE TABLE IF NOT EXISTS modules (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    course_id BIGINT NOT NULL,
    module_name VARCHAR(255) NOT NULL,
    description TEXT,
    module_order INT NOT NULL,
    tasks_per_module INT DEFAULT 10, -- Configurable number of tasks per module
    module_test_questions INT DEFAULT 3, -- Configurable number of questions in module test
    total_tasks INT DEFAULT 0 COMMENT 'Total number of tasks in this module',
    total_test_questions INT DEFAULT 0 COMMENT 'Total number of test questions in this module',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE
);

-- Tasks table (coding problems belonging to modules)
CREATE TABLE IF NOT EXISTS tasks (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    module_id BIGINT NOT NULL,
    task_name VARCHAR(255) NOT NULL,
    description TEXT,
    problem_statement TEXT NOT NULL,
    expected_output TEXT,
    sample_input TEXT,
    sample_output TEXT,
    difficulty ENUM('EASY', 'MEDIUM', 'HARD') DEFAULT 'MEDIUM',
    points INT DEFAULT 10,
    time_limit INT DEFAULT 30, -- in minutes
    language VARCHAR(20) DEFAULT 'Python',
    test_cases_count INT DEFAULT 0 COMMENT 'Total number of validation test cases for this task',
    attachment_paths JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (module_id) REFERENCES modules(id) ON DELETE CASCADE
);

-- Coding questions table (for module tests and course tests)
CREATE TABLE IF NOT EXISTS coding_questions (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    module_id BIGINT NULL, -- NULL for course test questions
    course_id BIGINT NOT NULL,
    question_type ENUM('MODULE_TEST', 'COURSE_TEST') NOT NULL,
    question_text TEXT NOT NULL,
    problem_statement TEXT NOT NULL,
    expected_output TEXT,
    sample_input TEXT,
    sample_output TEXT,
    difficulty ENUM('EASY', 'MEDIUM', 'HARD') DEFAULT 'MEDIUM',
    points INT DEFAULT 20,
    time_limit INT DEFAULT 45, -- in minutes
    language VARCHAR(20) DEFAULT 'Python',
    test_cases JSON, -- Array of test cases
    test_cases_count INT DEFAULT 0 COMMENT 'Total number of validation test cases for this question',
    attachment_paths JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (module_id) REFERENCES modules(id) ON DELETE CASCADE,
    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE
);

-- Student course enrollments
CREATE TABLE IF NOT EXISTS student_enrollments (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    student_id BIGINT NOT NULL,
    course_id BIGINT NOT NULL,
    enrolled_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,
    UNIQUE KEY unique_enrollment (student_id, course_id),
    FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE
);

-- Student progress tracking
CREATE TABLE IF NOT EXISTS student_progress (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    student_id BIGINT NOT NULL,
    course_id BIGINT NOT NULL,
    module_id BIGINT NULL COMMENT 'Module ID - NULL for course-level progress',
    completed_tasks INT DEFAULT 0,
    total_tasks INT DEFAULT NULL, -- Will be set based on module configuration
    module_test_completed BOOLEAN DEFAULT FALSE,
    course_test_completed BOOLEAN DEFAULT FALSE,
    total_score INT DEFAULT 0,
    max_possible_score INT DEFAULT 0,
    progress_percentage DECIMAL(5,2) DEFAULT 0.00,
    assigned_question_ids JSON NULL COMMENT 'Assigned test question IDs for this module',
    module_status ENUM('NOT_STARTED', 'IN_PROGRESS', 'TASKS_COMPLETED', 'MODULE_COMPLETED') DEFAULT 'NOT_STARTED' COMMENT 'Current status of module progression',
    tasks_passed_count INT DEFAULT 0 COMMENT 'Number of tasks passed with >=50% score',
    min_tasks_required INT DEFAULT 0 COMMENT 'Minimum tasks required to unlock module test',
    can_attempt_module_test BOOLEAN DEFAULT FALSE COMMENT 'Whether student can attempt module test',
    module_test_score INT DEFAULT 0 COMMENT 'Score achieved in module test',
    module_test_max_score INT DEFAULT 0 COMMENT 'Maximum possible score in module test',
    module_test_passed BOOLEAN DEFAULT FALSE COMMENT 'Whether module test was passed (>=50%)',
    last_activity TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY unique_progress (student_id, course_id, module_id),
    FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
    FOREIGN KEY (module_id) REFERENCES modules(id) ON DELETE CASCADE
);

-- Student course progress tracking (course-level progression)
CREATE TABLE IF NOT EXISTS student_course_progress (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    student_id BIGINT NOT NULL,
    course_id BIGINT NOT NULL,
    current_module_order INT DEFAULT 1 COMMENT 'Current module student can access (sequential)',
    modules_completed INT DEFAULT 0 COMMENT 'Number of modules completed',
    total_modules INT DEFAULT 0 COMMENT 'Total modules in course',
    total_course_points INT DEFAULT 0 COMMENT 'Total points earned by student in this specific course from tasks, module tests, and course test',
    can_attempt_course_test BOOLEAN DEFAULT FALSE COMMENT 'Whether student can attempt course test',
    course_test_completed BOOLEAN DEFAULT FALSE COMMENT 'Whether course test was completed',
    course_test_score INT DEFAULT 0 COMMENT 'Score achieved in course test',
    course_test_max_score INT DEFAULT 0 COMMENT 'Maximum possible score in course test',
    course_test_passed BOOLEAN DEFAULT FALSE COMMENT 'Whether course test was passed (>=50%)',
    peer_helps_given INT NOT NULL DEFAULT 0 COMMENT 'Number of successful peer helps performed as helper in this course',
    peer_help_points_earned INT NOT NULL DEFAULT 0 COMMENT 'Total points earned as helper via peer help in this course',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY unique_student_course (student_id, course_id),
    FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE
);

-- Student assigned test questions (for module and course tests)
CREATE TABLE IF NOT EXISTS student_assigned_questions (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    student_id BIGINT NOT NULL,
    course_id BIGINT NOT NULL,
    module_id BIGINT NULL, -- NULL for course test questions
    question_type ENUM('MODULE_TEST', 'COURSE_TEST') NOT NULL,
    assigned_question_ids JSON NOT NULL, -- Array of question IDs assigned to student
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY unique_assignment (student_id, course_id, module_id, question_type),
    FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
    FOREIGN KEY (module_id) REFERENCES modules(id) ON DELETE CASCADE
);

-- Student attempts table (for tasks and tests)
CREATE TABLE IF NOT EXISTS student_attempts (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    student_id BIGINT NOT NULL,
    task_id BIGINT NULL, -- NULL for test attempts
    question_id BIGINT NULL, -- For coding question attempts
    module_id BIGINT NULL COMMENT 'Module ID - NULL for course tests',
    course_id BIGINT NOT NULL,
    attempt_type ENUM('TASK', 'MODULE_TEST', 'COURSE_TEST') NOT NULL,
    submitted_code TEXT NOT NULL,
    execution_result TEXT,
    is_correct BOOLEAN DEFAULT FALSE,
    score INT DEFAULT 0,
    max_score INT DEFAULT 0,
    attempt_number INT DEFAULT 1,
    execution_time BIGINT DEFAULT 0, -- in milliseconds
    status ENUM('SUBMITTED', 'RUNNING', 'COMPLETED', 'ERROR') DEFAULT 'SUBMITTED',
    is_latest BOOLEAN DEFAULT TRUE COMMENT 'Whether this is the latest attempt for this task/question',
    is_peer_helped BOOLEAN NOT NULL DEFAULT FALSE
        COMMENT 'TRUE when this attempt was submitted by a peer helper on behalf of this student',
    peer_help_request_id BIGINT NULL
        COMMENT 'FK to peer_help_requests.id — set when is_peer_helped = TRUE',
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP NULL,
    FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
    FOREIGN KEY (question_id) REFERENCES coding_questions(id) ON DELETE CASCADE,
    FOREIGN KEY (module_id) REFERENCES modules(id) ON DELETE CASCADE,
    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
    CONSTRAINT fk_attempt_peer_request
        FOREIGN KEY (peer_help_request_id) REFERENCES peer_help_requests(id) ON DELETE SET NULL
);

-- NOTE: Leaderboard data is computed live via aggregate queries on student_attempts
-- and student_course_progress. No leaderboard table needed.

-- Peer help requests table (short-lived, polled by target student dashboard)
CREATE TABLE IF NOT EXISTS peer_help_requests (
    id             BIGINT PRIMARY KEY AUTO_INCREMENT,
    requester_id   BIGINT NOT NULL COMMENT 'Student A — needs help',
    helper_id      BIGINT NOT NULL COMMENT 'Student B — asked to help',
    course_id      BIGINT NOT NULL,
    module_id      BIGINT NOT NULL,
    task_id        BIGINT NOT NULL COMMENT 'Peer help is scoped to TASK type only',
    status         ENUM('PENDING','ACCEPTED','REJECTED','EXPIRED','COMPLETED')
                   NOT NULL DEFAULT 'PENDING',
    created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    responded_at   TIMESTAMP NULL COMMENT 'When helper accepted or rejected',
    completed_at   TIMESTAMP NULL COMMENT 'When helper submitted the solution',
    FOREIGN KEY (requester_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (helper_id)    REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (course_id)    REFERENCES courses(id) ON DELETE CASCADE,
    FOREIGN KEY (module_id)    REFERENCES modules(id) ON DELETE CASCADE,
    FOREIGN KEY (task_id)      REFERENCES tasks(id) ON DELETE CASCADE
);

CREATE INDEX idx_peer_help_requests_helper_status ON peer_help_requests(helper_id, status);
CREATE INDEX idx_peer_help_requests_requester ON peer_help_requests(requester_id, status);

-- Peer help records table (permanent audit trail of completed sessions)
CREATE TABLE IF NOT EXISTS peer_help_records (
    id                BIGINT PRIMARY KEY AUTO_INCREMENT,
    request_id        BIGINT NOT NULL UNIQUE COMMENT 'One record per completed request',
    helper_id         BIGINT NOT NULL COMMENT 'Student B — performed the help',
    helped_student_id BIGINT NOT NULL COMMENT 'Student A — received the help',
    course_id         BIGINT NOT NULL,
    task_id           BIGINT NOT NULL,
    points_earned     INT NOT NULL DEFAULT 0 COMMENT 'Raw points the submission scored',
    helper_points     INT NOT NULL DEFAULT 0 COMMENT 'floor(points_earned / 2) awarded to helper',
    helped_points     INT NOT NULL DEFAULT 0 COMMENT 'ceil(points_earned / 2) awarded to helped student',
    completed_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (request_id)        REFERENCES peer_help_requests(id) ON DELETE CASCADE,
    FOREIGN KEY (helper_id)         REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (helped_student_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (course_id)         REFERENCES courses(id) ON DELETE CASCADE,
    FOREIGN KEY (task_id)           REFERENCES tasks(id) ON DELETE CASCADE
);

CREATE INDEX idx_peer_help_records_helper ON peer_help_records(helper_id, course_id);
CREATE INDEX idx_peer_help_records_helped ON peer_help_records(helped_student_id, course_id);

-- Course shop items table (items defined by instructor per course)
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

-- Student shop purchases table (points never deducted; spending tracked here separately)
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

-- Discussion threads table
CREATE TABLE IF NOT EXISTS discussion_threads (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    course_id BIGINT NOT NULL,
    module_id BIGINT NULL,
    task_id BIGINT NULL,
    created_by BIGINT NOT NULL,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    is_resolved BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
    FOREIGN KEY (module_id) REFERENCES modules(id) ON DELETE CASCADE,
    FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE
);

-- Discussion replies table
CREATE TABLE IF NOT EXISTS discussion_replies (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    thread_id BIGINT NOT NULL,
    replied_by BIGINT NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (thread_id) REFERENCES discussion_threads(id) ON DELETE CASCADE,
    FOREIGN KEY (replied_by) REFERENCES users(id) ON DELETE CASCADE
);

-- Enrollment numbers table for student course access
CREATE TABLE IF NOT EXISTS enrollment_numbers (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    enrollment_number VARCHAR(50) NOT NULL,
    course_id BIGINT NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
    UNIQUE KEY unique_enrollment_per_course (enrollment_number, course_id)
);

-- Email-based course access table
CREATE TABLE IF NOT EXISTS course_email_access (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    email VARCHAR(100) NOT NULL,
    course_id BIGINT NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
    UNIQUE KEY unique_email_per_course (email, course_id),
    INDEX idx_email_course (email, course_id)
);

-- Test cases table for tasks and coding questions
CREATE TABLE IF NOT EXISTS test_cases (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    task_id BIGINT NULL,
    question_id BIGINT NULL,
    input TEXT NOT NULL,
    expected_output TEXT NOT NULL,
    is_sample BOOLEAN DEFAULT FALSE, -- TRUE for sample (shown to student), FALSE for validation (hidden)
    order_index INT DEFAULT 0, -- Order of test case
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
    FOREIGN KEY (question_id) REFERENCES coding_questions(id) ON DELETE CASCADE,
    CONSTRAINT test_case_parent_check CHECK (
        (task_id IS NOT NULL AND question_id IS NULL) OR 
        (task_id IS NULL AND question_id IS NOT NULL)
    )
);

-- Add registration codes table for controlled user registration
CREATE TABLE IF NOT EXISTS registration_codes (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    role ENUM('INSTRUCTOR', 'STUDENT') NOT NULL UNIQUE,
    code CHAR(6) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Insert default registration codes
INSERT INTO registration_codes (role, code) VALUES 
('INSTRUCTOR', 'INST01'),
('STUDENT', 'STU001')
ON DUPLICATE KEY UPDATE code = VALUES(code);

-- Add indexes for better performance
CREATE INDEX idx_registration_codes_role ON registration_codes(role);
CREATE INDEX idx_student_progress_status ON student_progress(student_id, course_id, module_status);
CREATE INDEX idx_student_course_progress_current_module ON student_course_progress(student_id, course_id, current_module_order);
CREATE INDEX idx_student_course_progress_points ON student_course_progress(student_id, course_id, total_course_points);
CREATE INDEX idx_student_attempts_latest ON student_attempts(student_id, task_id, question_id, is_latest);
CREATE INDEX idx_student_attempts_student_module ON student_attempts(student_id, module_id, attempt_type);
CREATE INDEX idx_student_attempts_peer_helped ON student_attempts(student_id, task_id, is_peer_helped);

-- Create default admin user
INSERT INTO users (username, password, full_name, email, role, institution)
VALUES ('admin', 'admin123', 'System Administrator', 'admin@samvidya.com', 'ADMIN', 'SamVidya Institute')
ON DUPLICATE KEY UPDATE id=id;

-- Create sample instructor users
INSERT INTO users (username, password, full_name, email, role, institution)
VALUES 
('instructor1', 'instructor123', 'Dr. John Smith', 'john.smith@samvidya.com', 'INSTRUCTOR', 'SamVidya Institute'),
('instructor2', 'instructor123', 'Prof. Sarah Johnson', 'sarah.johnson@samvidya.com', 'INSTRUCTOR', 'SamVidya Institute')
ON DUPLICATE KEY UPDATE id=id;

-- Create sample student users
INSERT INTO users (username, password, full_name, email, role, institution, enrollment_number)
VALUES 
('student1', 'student123', 'Alice Brown', 'alice.brown@student.samvidya.com', 'STUDENT', 'SamVidya Institute', 'STU001'),
('student2', 'student123', 'Bob Wilson', 'bob.wilson@student.samvidya.com', 'STUDENT', 'SamVidya Institute', 'STU002')
ON DUPLICATE KEY UPDATE id=id;

-- Using plain password for initial seed, will be migrated to hash on first login

-- Add indexes for better performance
CREATE INDEX idx_student_assigned_questions_student_course ON student_assigned_questions(student_id, course_id);
CREATE INDEX idx_student_progress_student_course_module ON student_progress(student_id, course_id, module_id);
CREATE INDEX idx_coding_questions_test_cases_count ON coding_questions(test_cases_count);
CREATE INDEX idx_tasks_test_cases_count ON tasks(test_cases_count);
CREATE INDEX idx_modules_total_tasks ON modules(total_tasks);
CREATE INDEX idx_modules_total_test_questions ON modules(total_test_questions);

-- Create stored procedure to update progression status
DELIMITER //

CREATE PROCEDURE UpdateStudentProgression(
    IN p_student_id BIGINT,
    IN p_course_id BIGINT,
    IN p_module_id BIGINT
)
BEGIN
    DECLARE v_tasks_passed INT DEFAULT 0;
    DECLARE v_min_required INT DEFAULT 0;
    DECLARE v_module_order INT DEFAULT 0;
    DECLARE v_module_test_passed BOOLEAN DEFAULT FALSE;
    
    -- Get current module info
    SELECT m.module_order, m.tasks_per_module 
    INTO v_module_order, v_min_required
    FROM modules m 
    WHERE m.id = p_module_id;
    
    -- Count passed tasks for this module
    SELECT COUNT(DISTINCT sa.task_id)
    INTO v_tasks_passed
    FROM student_attempts sa
    WHERE sa.student_id = p_student_id 
    AND sa.module_id = p_module_id 
    AND sa.attempt_type = 'TASK'
    AND sa.is_latest = TRUE
    AND sa.score >= (sa.max_score * 0.5); -- 50% or more
    
    -- Check if module test is passed
    SELECT COUNT(*) > 0
    INTO v_module_test_passed
    FROM student_attempts sa
    WHERE sa.student_id = p_student_id 
    AND sa.module_id = p_module_id 
    AND sa.attempt_type = 'MODULE_TEST'
    AND sa.is_latest = TRUE
    AND sa.score >= (sa.max_score * 0.5); -- 50% or more
    
    -- Update student_progress
    UPDATE student_progress 
    SET 
        tasks_passed_count = v_tasks_passed,
        min_tasks_required = v_min_required,
        can_attempt_module_test = (v_tasks_passed >= v_min_required),
        module_status = CASE 
            WHEN v_module_test_passed THEN 'MODULE_COMPLETED'
            WHEN v_tasks_passed >= v_min_required THEN 'TASKS_COMPLETED'
            WHEN v_tasks_passed > 0 THEN 'IN_PROGRESS'
            ELSE 'NOT_STARTED'
        END,
        module_test_passed = v_module_test_passed,
        updated_at = CURRENT_TIMESTAMP
    WHERE student_id = p_student_id 
    AND course_id = p_course_id 
    AND module_id = p_module_id;
    
    -- Update course-level progression
    UPDATE student_course_progress scp
    SET 
        modules_completed = (
            SELECT COUNT(*) 
            FROM student_progress sp 
            WHERE sp.student_id = p_student_id 
            AND sp.course_id = p_course_id 
            AND sp.module_status = 'MODULE_COMPLETED'
        ),
        current_module_order = LEAST(
            (SELECT MIN(m.module_order) 
             FROM modules m 
             JOIN student_progress sp ON m.id = sp.module_id
             WHERE sp.student_id = p_student_id 
             AND sp.course_id = p_course_id 
             AND sp.module_status != 'MODULE_COMPLETED'
             AND m.is_active = TRUE),
            scp.total_modules + 1
        ),
        can_attempt_course_test = (
            SELECT COUNT(*) 
            FROM student_progress sp 
            WHERE sp.student_id = p_student_id 
            AND sp.course_id = p_course_id 
            AND sp.module_status = 'MODULE_COMPLETED'
        ) >= scp.total_modules,
        updated_at = CURRENT_TIMESTAMP
    WHERE scp.student_id = p_student_id 
    AND scp.course_id = p_course_id;
    
END//

-- Create trigger to maintain is_latest flag when new attempts are inserted
-- NOTE: This trigger was removed due to MySQL limitation - handled in DAO instead

-- Create trigger to update progression after attempt insertion  
-- NOTE: This trigger was removed due to MySQL limitation - handled in DAO instead

DELIMITER ;

-- Add triggers to automatically maintain test_cases_count in coding_questions table
DELIMITER //

CREATE TRIGGER update_question_test_cases_count_after_insert
AFTER INSERT ON test_cases
FOR EACH ROW
BEGIN
    IF NEW.question_id IS NOT NULL AND NEW.is_sample = FALSE THEN
        UPDATE coding_questions 
        SET test_cases_count = (
            SELECT COUNT(*) 
            FROM test_cases 
            WHERE question_id = NEW.question_id 
            AND is_sample = FALSE
        )
        WHERE id = NEW.question_id;
    END IF;
END//

CREATE TRIGGER update_question_test_cases_count_after_delete
AFTER DELETE ON test_cases
FOR EACH ROW
BEGIN
    IF OLD.question_id IS NOT NULL AND OLD.is_sample = FALSE THEN
        UPDATE coding_questions 
        SET test_cases_count = (
            SELECT COUNT(*) 
            FROM test_cases 
            WHERE question_id = OLD.question_id 
            AND is_sample = FALSE
        )
        WHERE id = OLD.question_id;
    END IF;
END//

CREATE TRIGGER update_question_test_cases_count_after_update
AFTER UPDATE ON test_cases
FOR EACH ROW
BEGIN
    -- Handle case where question_id changed or is_sample changed
    IF OLD.question_id != NEW.question_id OR OLD.is_sample != NEW.is_sample THEN
        -- Update old question if it exists
        IF OLD.question_id IS NOT NULL THEN
            UPDATE coding_questions 
            SET test_cases_count = (
                SELECT COUNT(*) 
                FROM test_cases 
                WHERE question_id = OLD.question_id 
                AND is_sample = FALSE
            )
            WHERE id = OLD.question_id;
        END IF;
        
        -- Update new question if it exists
        IF NEW.question_id IS NOT NULL THEN
            UPDATE coding_questions 
            SET test_cases_count = (
                SELECT COUNT(*) 
                FROM test_cases 
                WHERE question_id = NEW.question_id 
                AND is_sample = FALSE
            )
            WHERE id = NEW.question_id;
        END IF;
    END IF;
END//

-- Add triggers to automatically update test_cases_count for tasks when test_cases are added/removed/updated
CREATE TRIGGER update_task_test_cases_count_after_insert
AFTER INSERT ON test_cases
FOR EACH ROW
BEGIN
    IF NEW.task_id IS NOT NULL AND NEW.is_sample = FALSE THEN
        UPDATE tasks 
        SET test_cases_count = (
            SELECT COUNT(*) 
            FROM test_cases 
            WHERE task_id = NEW.task_id 
            AND is_sample = FALSE
        )
        WHERE id = NEW.task_id;
    END IF;
END//

CREATE TRIGGER update_task_test_cases_count_after_delete
AFTER DELETE ON test_cases
FOR EACH ROW
BEGIN
    IF OLD.task_id IS NOT NULL AND OLD.is_sample = FALSE THEN
        UPDATE tasks 
        SET test_cases_count = (
            SELECT COUNT(*) 
            FROM test_cases 
            WHERE task_id = OLD.task_id 
            AND is_sample = FALSE
        )
        WHERE id = OLD.task_id;
    END IF;
END//

CREATE TRIGGER update_task_test_cases_count_after_update
AFTER UPDATE ON test_cases
FOR EACH ROW
BEGIN
    -- Handle case where task_id changed or is_sample changed
    IF OLD.task_id != NEW.task_id OR OLD.is_sample != NEW.is_sample THEN
        -- Update old task if it exists
        IF OLD.task_id IS NOT NULL THEN
            UPDATE tasks 
            SET test_cases_count = (
                SELECT COUNT(*) 
                FROM test_cases 
                WHERE task_id = OLD.task_id 
                AND is_sample = FALSE
            )
            WHERE id = OLD.task_id;
        END IF;
        
        -- Update new task if it exists
        IF NEW.task_id IS NOT NULL THEN
            UPDATE tasks 
            SET test_cases_count = (
                SELECT COUNT(*) 
                FROM test_cases 
                WHERE task_id = NEW.task_id 
                AND is_sample = FALSE
            )
            WHERE id = NEW.task_id;
        END IF;
    END IF;
END//

-- Add triggers to automatically update total_tasks when tasks are added/removed/updated
CREATE TRIGGER update_module_total_tasks_after_insert
AFTER INSERT ON tasks
FOR EACH ROW
BEGIN
    UPDATE modules 
    SET total_tasks = (
        SELECT COUNT(*) 
        FROM tasks 
        WHERE module_id = NEW.module_id
    )
    WHERE id = NEW.module_id;
END//

CREATE TRIGGER update_module_total_tasks_after_delete
AFTER DELETE ON tasks
FOR EACH ROW
BEGIN
    UPDATE modules 
    SET total_tasks = (
        SELECT COUNT(*) 
        FROM tasks 
        WHERE module_id = OLD.module_id
    )
    WHERE id = OLD.module_id;
END//

CREATE TRIGGER update_module_total_tasks_after_update
AFTER UPDATE ON tasks
FOR EACH ROW
BEGIN
    -- Handle case where module_id changed
    IF OLD.module_id != NEW.module_id THEN
        -- Update old module
        UPDATE modules 
        SET total_tasks = (
            SELECT COUNT(*) 
            FROM tasks 
            WHERE module_id = OLD.module_id
        )
        WHERE id = OLD.module_id;
        
        -- Update new module
        UPDATE modules 
        SET total_tasks = (
            SELECT COUNT(*) 
            FROM tasks 
            WHERE module_id = NEW.module_id
        )
        WHERE id = NEW.module_id;
    END IF;
END//

-- Add triggers to automatically update total_test_questions when coding_questions are added/removed/updated
CREATE TRIGGER update_module_total_test_questions_after_insert
AFTER INSERT ON coding_questions
FOR EACH ROW
BEGIN
    IF NEW.module_id IS NOT NULL AND NEW.question_type = 'MODULE_TEST' THEN
        UPDATE modules 
        SET total_test_questions = (
            SELECT COUNT(*) 
            FROM coding_questions 
            WHERE module_id = NEW.module_id 
            AND question_type = 'MODULE_TEST'
        )
        WHERE id = NEW.module_id;
    END IF;
END//

CREATE TRIGGER update_module_total_test_questions_after_delete
AFTER DELETE ON coding_questions
FOR EACH ROW
BEGIN
    IF OLD.module_id IS NOT NULL AND OLD.question_type = 'MODULE_TEST' THEN
        UPDATE modules 
        SET total_test_questions = (
            SELECT COUNT(*) 
            FROM coding_questions 
            WHERE module_id = OLD.module_id 
            AND question_type = 'MODULE_TEST'
        )
        WHERE id = OLD.module_id;
    END IF;
END//

CREATE TRIGGER update_module_total_test_questions_after_update
AFTER UPDATE ON coding_questions
FOR EACH ROW
BEGIN
    -- Handle case where module_id changed or question_type changed
    IF (OLD.module_id != NEW.module_id) OR (OLD.question_type != NEW.question_type) THEN
        -- Update old module if it was a module test
        IF OLD.module_id IS NOT NULL AND OLD.question_type = 'MODULE_TEST' THEN
            UPDATE modules 
            SET total_test_questions = (
                SELECT COUNT(*) 
                FROM coding_questions 
                WHERE module_id = OLD.module_id 
                AND question_type = 'MODULE_TEST'
            )
            WHERE id = OLD.module_id;
        END IF;
        
        -- Update new module if it's a module test
        IF NEW.module_id IS NOT NULL AND NEW.question_type = 'MODULE_TEST' THEN
            UPDATE modules 
            SET total_test_questions = (
                SELECT COUNT(*) 
                FROM coding_questions 
                WHERE module_id = NEW.module_id 
                AND question_type = 'MODULE_TEST'
            )
            WHERE id = NEW.module_id;
        END IF;
    END IF;
END//

DELIMITER ;

-- Create MySQL user and grant permissions
CREATE USER IF NOT EXISTS 'samvidyaAdmin'@'localhost' IDENTIFIED WITH mysql_native_password BY 'Admin@123';
CREATE USER IF NOT EXISTS 'samvidyaAdmin'@'%' IDENTIFIED WITH mysql_native_password BY 'Admin@123';
GRANT ALL PRIVILEGES ON samvidya.* TO 'samvidyaAdmin'@'localhost';
GRANT ALL PRIVILEGES ON samvidya.* TO 'samvidyaAdmin'@'%';
FLUSH PRIVILEGES;