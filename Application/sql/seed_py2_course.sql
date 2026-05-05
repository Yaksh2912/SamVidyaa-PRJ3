-- Seed data for PY2 course with random assignment testing
USE samvidya;

-- Create PY2 course
INSERT INTO courses (course_code, course_name, description, subject, instructor_id, instructor_name, course_test_questions, is_active)
VALUES ('PY2', 'Advanced Python Programming', 'Advanced concepts in Python programming including OOP, data structures, and algorithms', 'Python', 2, 'Dr. John Smith', 2, TRUE)
ON DUPLICATE KEY UPDATE id=id;

-- Get the course ID for PY2
SET @py2_course_id = (SELECT id FROM courses WHERE course_code = 'PY2');

-- Create 3 modules for PY2 course (each will serve 5 tasks and 2 tests, but we'll create 7 tasks and 4 tests)
INSERT INTO modules (course_id, module_name, description, module_order, tasks_per_module, module_test_questions, is_active)
VALUES 
(@py2_course_id, 'Object-Oriented Programming', 'Learn classes, objects, inheritance, and polymorphism in Python', 1, 5, 2, TRUE),
(@py2_course_id, 'Data Structures', 'Implement and use lists, dictionaries, sets, and custom data structures', 2, 5, 2, TRUE),
(@py2_course_id, 'Algorithms and Problem Solving', 'Learn sorting, searching, and algorithmic problem-solving techniques', 3, 5, 2, TRUE)
ON DUPLICATE KEY UPDATE id=id;

-- Get module IDs
SET @module1_id = (SELECT id FROM modules WHERE course_id = @py2_course_id AND module_name = 'Object-Oriented Programming');
SET @module2_id = (SELECT id FROM modules WHERE course_id = @py2_course_id AND module_name = 'Data Structures');
SET @module3_id = (SELECT id FROM modules WHERE course_id = @py2_course_id AND module_name = 'Algorithms and Problem Solving');

-- Module 1: Object-Oriented Programming (7 tasks, students get 5 random)
INSERT INTO tasks (module_id, task_name, description, problem_statement, difficulty, points, time_limit, language)
VALUES 
(@module1_id, 'Basic Class Definition', 'Create a simple class', 'Create a class called "Person" with attributes name and age, and a method to display the information.\n\nInput Format:\nName on first line\nAge on second line\n\nOutput Format:\nName: [name], Age: [age]', 'EASY', 10, 20, 'Python'),
(@module1_id, 'Class with Constructor', 'Implement __init__ method', 'Create a class "Rectangle" with constructor that takes length and width, and a method to calculate area.\n\nInput Format:\nLength on first line\nWidth on second line\n\nOutput Format:\nArea: [calculated area]', 'EASY', 15, 25, 'Python'),
(@module1_id, 'Inheritance Example', 'Implement class inheritance', 'Create a base class "Animal" with method speak(), and derived class "Dog" that overrides speak() to return "Woof!".\n\nInput Format:\nNo input required\n\nOutput Format:\nWoof!', 'MEDIUM', 20, 30, 'Python'),
(@module1_id, 'Method Overriding', 'Override parent class methods', 'Create classes "Shape" and "Circle" where Circle overrides the area() method to calculate circle area.\n\nInput Format:\nRadius on first line\n\nOutput Format:\nArea: [calculated area with 2 decimal places]', 'MEDIUM', 20, 35, 'Python'),
(@module1_id, 'Polymorphism Demo', 'Demonstrate polymorphic behavior', 'Create multiple classes with same method name and demonstrate polymorphism.\n\nInput Format:\nShape type (circle/rectangle)\nDimensions based on shape\n\nOutput Format:\nArea: [calculated area]', 'HARD', 25, 40, 'Python'),
(@module1_id, 'Class Properties', 'Use @property decorator', 'Create a class with private attributes and public properties using @property decorator.\n\nInput Format:\nValue to set\n\nOutput Format:\nProperty value: [value]', 'MEDIUM', 18, 30, 'Python'),
(@module1_id, 'Static and Class Methods', 'Implement static and class methods', 'Create a class with static method, class method, and instance method.\n\nInput Format:\nMethod type (static/class/instance)\nValue if needed\n\nOutput Format:\nResult from specified method', 'HARD', 25, 45, 'Python')
ON DUPLICATE KEY UPDATE id=id;

-- Module 2: Data Structures (7 tasks, students get 5 random)
INSERT INTO tasks (module_id, task_name, description, problem_statement, difficulty, points, time_limit, language)
VALUES 
(@module2_id, 'List Operations', 'Basic list manipulations', 'Perform various operations on a list: append, remove, sort, and find maximum.\n\nInput Format:\nSpace-separated integers\nOperation (append/remove/sort/max)\nValue (if needed for operation)\n\nOutput Format:\nResult of operation', 'EASY', 12, 20, 'Python'),
(@module2_id, 'Dictionary Management', 'Work with dictionaries', 'Create and manipulate a dictionary of student grades.\n\nInput Format:\nStudent name\nGrade\nOperation (add/get/average)\n\nOutput Format:\nResult based on operation', 'EASY', 15, 25, 'Python'),
(@module2_id, 'Set Operations', 'Perform set operations', 'Implement union, intersection, and difference operations on sets.\n\nInput Format:\nTwo lines of space-separated integers\nOperation (union/intersection/difference)\n\nOutput Format:\nResulting set elements', 'MEDIUM', 18, 30, 'Python'),
(@module2_id, 'Stack Implementation', 'Implement a stack data structure', 'Create a stack class with push, pop, and peek operations.\n\nInput Format:\nSequence of operations (push x/pop/peek)\n\nOutput Format:\nResult of each operation', 'MEDIUM', 22, 35, 'Python'),
(@module2_id, 'Queue Implementation', 'Implement a queue data structure', 'Create a queue class with enqueue, dequeue, and front operations.\n\nInput Format:\nSequence of operations (enqueue x/dequeue/front)\n\nOutput Format:\nResult of each operation', 'MEDIUM', 22, 35, 'Python'),
(@module2_id, 'Binary Tree Traversal', 'Implement tree traversal', 'Create a binary tree and implement inorder traversal.\n\nInput Format:\nTree nodes in level order (null for empty)\n\nOutput Format:\nInorder traversal result', 'HARD', 30, 45, 'Python'),
(@module2_id, 'Hash Table Implementation', 'Create a hash table', 'Implement a simple hash table with collision handling.\n\nInput Format:\nOperations (put key value/get key/remove key)\n\nOutput Format:\nResult of each operation', 'HARD', 28, 50, 'Python')
ON DUPLICATE KEY UPDATE id=id;

-- Module 3: Algorithms and Problem Solving (7 tasks, students get 5 random)
INSERT INTO tasks (module_id, task_name, description, problem_statement, difficulty, points, time_limit, language)
VALUES 
(@module3_id, 'Bubble Sort', 'Implement bubble sort algorithm', 'Sort an array using bubble sort algorithm.\n\nInput Format:\nSpace-separated integers\n\nOutput Format:\nSorted array elements', 'EASY', 15, 25, 'Python'),
(@module3_id, 'Binary Search', 'Implement binary search', 'Find an element in a sorted array using binary search.\n\nInput Format:\nSorted space-separated integers\nTarget element to find\n\nOutput Format:\nIndex of element (or -1 if not found)', 'MEDIUM', 20, 30, 'Python'),
(@module3_id, 'Fibonacci Sequence', 'Generate Fibonacci numbers', 'Generate the first n Fibonacci numbers using dynamic programming.\n\nInput Format:\nNumber n\n\nOutput Format:\nFirst n Fibonacci numbers', 'MEDIUM', 18, 25, 'Python'),
(@module3_id, 'Quick Sort', 'Implement quicksort algorithm', 'Sort an array using quicksort algorithm with proper pivot selection.\n\nInput Format:\nSpace-separated integers\n\nOutput Format:\nSorted array elements', 'HARD', 25, 40, 'Python'),
(@module3_id, 'Merge Sort', 'Implement merge sort algorithm', 'Sort an array using merge sort algorithm.\n\nInput Format:\nSpace-separated integers\n\nOutput Format:\nSorted array elements', 'HARD', 25, 40, 'Python'),
(@module3_id, 'Longest Common Subsequence', 'Find LCS using DP', 'Find the longest common subsequence between two strings.\n\nInput Format:\nFirst string\nSecond string\n\nOutput Format:\nLength of LCS', 'HARD', 30, 45, 'Python'),
(@module3_id, 'Graph BFS Traversal', 'Implement BFS algorithm', 'Perform breadth-first search on a graph.\n\nInput Format:\nNumber of vertices\nEdges (u v format)\nStarting vertex\n\nOutput Format:\nBFS traversal order', 'HARD', 35, 50, 'Python')
ON DUPLICATE KEY UPDATE id=id;

-- Create test cases for some tasks (sample implementation)
-- Test cases for Basic Class Definition
INSERT INTO test_cases (task_id, input, expected_output, is_sample, order_index)
VALUES 
((SELECT id FROM tasks WHERE task_name = 'Basic Class Definition' AND module_id = @module1_id), 'John\n25', 'Name: John, Age: 25', TRUE, 1),
((SELECT id FROM tasks WHERE task_name = 'Basic Class Definition' AND module_id = @module1_id), 'Alice\n30', 'Name: Alice, Age: 30', FALSE, 2)
ON DUPLICATE KEY UPDATE id=id;

-- Test cases for List Operations
INSERT INTO test_cases (task_id, input, expected_output, is_sample, order_index)
VALUES 
((SELECT id FROM tasks WHERE task_name = 'List Operations' AND module_id = @module2_id), '1 2 3 4 5\nmax', '5', TRUE, 1),
((SELECT id FROM tasks WHERE task_name = 'List Operations' AND module_id = @module2_id), '5 2 8 1 9\nsort', '1 2 5 8 9', FALSE, 2)
ON DUPLICATE KEY UPDATE id=id;

-- Test cases for Bubble Sort
INSERT INTO test_cases (task_id, input, expected_output, is_sample, order_index)
VALUES 
((SELECT id FROM tasks WHERE task_name = 'Bubble Sort' AND module_id = @module3_id), '64 34 25 12 22 11 90', '11 12 22 25 34 64 90', TRUE, 1),
((SELECT id FROM tasks WHERE task_name = 'Bubble Sort' AND module_id = @module3_id), '5 2 8 1 9', '1 2 5 8 9', FALSE, 2)
ON DUPLICATE KEY UPDATE id=id;

-- Create coding questions for module tests (4 questions per module, students get 2 random)
-- Module 1 Test Questions
INSERT INTO coding_questions (module_id, course_id, question_type, question_text, problem_statement, difficulty, points, time_limit, language)
VALUES 
(@module1_id, @py2_course_id, 'MODULE_TEST', 'Class Inheritance Test', 'Create a Vehicle class and Car class that inherits from Vehicle. Implement proper inheritance with method overriding.\n\nInput Format:\nVehicle type\nSpecific attributes\n\nOutput Format:\nVehicle information', 'MEDIUM', 25, 30, 'Python'),
(@module1_id, @py2_course_id, 'MODULE_TEST', 'Polymorphism Test', 'Demonstrate polymorphism with multiple classes implementing the same interface.\n\nInput Format:\nObject type and parameters\n\nOutput Format:\nPolymorphic method result', 'MEDIUM', 25, 35, 'Python'),
(@module1_id, @py2_course_id, 'MODULE_TEST', 'Encapsulation Test', 'Create a class with private attributes and public methods to access them.\n\nInput Format:\nAttribute values\n\nOutput Format:\nEncapsulated data access result', 'MEDIUM', 20, 25, 'Python'),
(@module1_id, @py2_course_id, 'MODULE_TEST', 'Abstract Class Test', 'Implement an abstract base class and concrete derived classes.\n\nInput Format:\nClass type and parameters\n\nOutput Format:\nAbstract method implementation result', 'HARD', 30, 40, 'Python')
ON DUPLICATE KEY UPDATE id=id;

-- Module 2 Test Questions
INSERT INTO coding_questions (module_id, course_id, question_type, question_text, problem_statement, difficulty, points, time_limit, language)
VALUES 
(@module2_id, @py2_course_id, 'MODULE_TEST', 'Advanced List Operations', 'Implement complex list operations including nested list processing.\n\nInput Format:\nNested list structure\nOperation type\n\nOutput Format:\nProcessed result', 'MEDIUM', 25, 30, 'Python'),
(@module2_id, @py2_course_id, 'MODULE_TEST', 'Dictionary Algorithms', 'Solve problems using dictionary data structures efficiently.\n\nInput Format:\nData elements\nQuery operations\n\nOutput Format:\nQuery results', 'MEDIUM', 25, 35, 'Python'),
(@module2_id, @py2_course_id, 'MODULE_TEST', 'Custom Data Structure', 'Implement a custom data structure with specific operations.\n\nInput Format:\nOperations sequence\n\nOutput Format:\nOperation results', 'HARD', 30, 40, 'Python'),
(@module2_id, @py2_course_id, 'MODULE_TEST', 'Tree Operations', 'Implement tree operations including insertion, deletion, and traversal.\n\nInput Format:\nTree operations\n\nOutput Format:\nTree state after operations', 'HARD', 30, 45, 'Python')
ON DUPLICATE KEY UPDATE id=id;

-- Module 3 Test Questions
INSERT INTO coding_questions (module_id, course_id, question_type, question_text, problem_statement, difficulty, points, time_limit, language)
VALUES 
(@module3_id, @py2_course_id, 'MODULE_TEST', 'Sorting Algorithm Comparison', 'Implement and compare different sorting algorithms.\n\nInput Format:\nArray to sort\nAlgorithm type\n\nOutput Format:\nSorted array and performance metrics', 'MEDIUM', 25, 35, 'Python'),
(@module3_id, @py2_course_id, 'MODULE_TEST', 'Dynamic Programming Problem', 'Solve a complex problem using dynamic programming approach.\n\nInput Format:\nProblem parameters\n\nOutput Format:\nOptimal solution', 'HARD', 30, 40, 'Python'),
(@module3_id, @py2_course_id, 'MODULE_TEST', 'Graph Algorithm', 'Implement graph algorithms for shortest path or connectivity.\n\nInput Format:\nGraph representation\nQuery parameters\n\nOutput Format:\nAlgorithm result', 'HARD', 30, 45, 'Python'),
(@module3_id, @py2_course_id, 'MODULE_TEST', 'Optimization Problem', 'Solve an optimization problem using appropriate algorithms.\n\nInput Format:\nProblem constraints\n\nOutput Format:\nOptimal solution with explanation', 'HARD', 35, 50, 'Python')
ON DUPLICATE KEY UPDATE id=id;

-- Create course-level test questions (4 questions, students get 2 random)
INSERT INTO coding_questions (module_id, course_id, question_type, question_text, problem_statement, difficulty, points, time_limit, language)
VALUES 
(NULL, @py2_course_id, 'COURSE_TEST', 'Comprehensive OOP Design', 'Design a complete object-oriented system with multiple classes, inheritance, and polymorphism.\n\nInput Format:\nSystem requirements\n\nOutput Format:\nSystem implementation result', 'HARD', 40, 60, 'Python'),
(NULL, @py2_course_id, 'COURSE_TEST', 'Advanced Algorithm Implementation', 'Implement a complex algorithm combining multiple data structures and algorithmic techniques.\n\nInput Format:\nProblem specification\n\nOutput Format:\nAlgorithm solution', 'HARD', 40, 60, 'Python'),
(NULL, @py2_course_id, 'COURSE_TEST', 'Data Structure Design', 'Design and implement a custom data structure with specific performance requirements.\n\nInput Format:\nData structure requirements\nOperations to perform\n\nOutput Format:\nData structure implementation and results', 'HARD', 35, 55, 'Python'),
(NULL, @py2_course_id, 'COURSE_TEST', 'System Integration Problem', 'Integrate multiple programming concepts to solve a real-world problem.\n\nInput Format:\nProblem description\nConstraints\n\nOutput Format:\nComplete solution with explanation', 'HARD', 45, 70, 'Python')
ON DUPLICATE KEY UPDATE id=id;

-- Create enrollment numbers for PY2 course
INSERT INTO enrollment_numbers (enrollment_number, course_id, is_active)
VALUES 
('STU001', @py2_course_id, TRUE),
('STU002', @py2_course_id, TRUE)
ON DUPLICATE KEY UPDATE id=id;

-- Add some test cases for coding questions (sample)
INSERT INTO test_cases (question_id, input, expected_output, is_sample, order_index)
VALUES 
((SELECT id FROM coding_questions WHERE question_text = 'Class Inheritance Test' AND module_id = @module1_id), 'Car\nToyota Camry\n4', 'Vehicle: Car, Brand: Toyota, Model: Camry, Doors: 4', TRUE, 1),
((SELECT id FROM coding_questions WHERE question_text = 'Advanced List Operations' AND module_id = @module2_id), '[[1,2],[3,4]]\nflatten', '[1, 2, 3, 4]', TRUE, 1),
((SELECT id FROM coding_questions WHERE question_text = 'Sorting Algorithm Comparison' AND module_id = @module3_id), '5 2 8 1 9\nquicksort', '[1, 2, 5, 8, 9]', TRUE, 1)
ON DUPLICATE KEY UPDATE id=id;

-- Display summary of created data
SELECT 
    'PY2 Course Created' as Status,
    @py2_course_id as CourseId,
    (SELECT COUNT(*) FROM modules WHERE course_id = @py2_course_id) as ModulesCreated,
    (SELECT COUNT(*) FROM tasks WHERE module_id IN (SELECT id FROM modules WHERE course_id = @py2_course_id)) as TasksCreated,
    (SELECT COUNT(*) FROM coding_questions WHERE course_id = @py2_course_id) as QuestionsCreated;

-- Show the random assignment configuration
SELECT 
    m.module_name,
    m.tasks_per_module as TasksToServe,
    (SELECT COUNT(*) FROM tasks WHERE module_id = m.id) as TotalTasks,
    m.module_test_questions as QuestionsToServe,
    (SELECT COUNT(*) FROM coding_questions WHERE module_id = m.id AND question_type = 'MODULE_TEST') as TotalQuestions
FROM modules m 
WHERE m.course_id = @py2_course_id
ORDER BY m.module_order;

SELECT 
    'Course Test Configuration' as Type,
    c.course_test_questions as QuestionsToServe,
    (SELECT COUNT(*) FROM coding_questions WHERE course_id = c.id AND question_type = 'COURSE_TEST') as TotalQuestions
FROM courses c 
WHERE c.id = @py2_course_id;