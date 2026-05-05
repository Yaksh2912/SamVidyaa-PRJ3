# SamVidya - Educational Platform for Practical Programming

SamVidya is a JavaFX-based desktop application designed to facilitate hands-on learning through structured courses, modules, tasks, and assessments for BTech Computer Science Engineering students.

## Features

### For Instructors
- **Course Management**: Create and manage programming courses (Python, C++, Java, DSA)
- **Module Creation**: Organize courses into structured modules
- **Task Management**: Create coding tasks with automatic evaluation
- **Test Generation**: Auto-generate module tests (3 questions) and course tests (5 questions)
- **Student Analytics**: Monitor student progress and performance
- **Discussion Moderation**: Manage student discussions and Q&A

### For Students
- **Course Access**: Access enrolled courses and modules
- **Task Completion**: Solve coding problems with instant feedback
- **Progress Tracking**: Monitor learning progress and scores
- **Leaderboards**: Compete with peers in course rankings
- **Discussions**: Ask questions and participate in course discussions

### For Administrators
- **User Management**: Create instructor and student accounts
- **Course Oversight**: Manage all courses across the platform
- **System Analytics**: Access comprehensive reports and analytics
- **Multi-Institution Support**: Scalable architecture for multiple institutions

## Technical Features

- **Secure Code Execution**: Sandboxed Python code execution using Docker
- **Randomized Assessments**: 10 random tasks per module for each student
- **Reattempt Support**: Allow multiple attempts with reduced scoring
- **Local Database**: MySQL database for reliable data storage
- **Modern UI**: JavaFX-based responsive user interface

## System Requirements

- **Operating System**: Windows 10 or later
- **Java**: JDK 11 or later
- **Database**: MySQL 8.0 or later
- **Docker**: Docker Desktop (for secure code execution)
- **Memory**: Minimum 4GB RAM
- **Storage**: 2GB available space

## Installation

### Prerequisites
1. Install Java JDK 11 or later
2. Install MySQL 8.0 or later
3. Install Docker Desktop (optional, for sandboxed execution)
4. Install Maven 3.6 or later

### Database Setup
1. Start MySQL server
2. Run the database schema:
   ```bash
   mysql -u root -p < sql/schema.sql
   ```

### Application Setup
1. Clone the repository
2. Configure environment variables in `.env` file
3. Build the application:
   ```bash
   mvn clean compile
   ```
4. Run the application:
   ```bash
   mvn javafx:run
   ```

## Configuration

### Environment Variables (.env)
```properties
# Database Configuration
DB_HOST=localhost
DB_PORT=3306
DB_NAME=samvidya
DB_USERNAME=Admin
DB_PASSWORD=Admin@123

# Code Execution Configuration
DOCKER_ENABLED=true
PYTHON_TIMEOUT_SECONDS=30
MEMORY_LIMIT_MB=128
```

## Usage

### First Time Setup
1. Launch the application
2. Select "Administrator" role
3. Login with default credentials:
   - Username: `admin`
   - Password: `admin123`
4. Create instructor accounts
5. Instructors can then create courses and register students

### Creating a Course (Instructor)
1. Login as instructor
2. Click "Create Course"
3. Fill in course details (name, subject, description)
4. Add modules to the course
5. Create tasks for each module
6. Register students to the course

### Taking a Course (Student)
1. Login as student
2. Select an enrolled course
3. Complete 10 random tasks per module
4. Take module test after completing tasks
5. Take final course test after all modules

## Architecture

### Project Structure
```
src/
├── main/
│   ├── java/com/samvidya/
│   │   ├── controller/     # JavaFX controllers
│   │   ├── dao/           # Data access objects
│   │   ├── model/         # Data models
│   │   ├── service/       # Business logic
│   │   └── util/          # Utility classes
│   └── resources/
│       ├── fxml/          # JavaFX FXML files
│       ├── css/           # Stylesheets
│       └── images/        # Application images
└── test/                  # Unit tests
```

### Database Schema
- **users**: User accounts (admin, instructor, student)
- **courses**: Course information
- **modules**: Course modules
- **tasks**: Coding tasks within modules
- **coding_questions**: Test questions for assessments
- **student_attempts**: Student submissions and results
- **student_progress**: Progress tracking per student
- **leaderboard**: Course and module rankings

## Development

### Building from Source
```bash
# Compile
mvn clean compile

# Run tests
mvn test

# Package
mvn clean package

# Run application
mvn javafx:run
```

### Adding New Features
1. Create model classes in `com.samvidya.model`
2. Implement DAO classes in `com.samvidya.dao`
3. Add business logic in `com.samvidya.service`
4. Create JavaFX controllers in `com.samvidya.controller`
5. Design FXML layouts in `src/main/resources/fxml`

## Security Features

- **Password Encryption**: BCrypt hashing for all passwords
- **Code Sandboxing**: Docker containers for secure code execution
- **Input Validation**: Comprehensive input sanitization
- **Session Management**: Secure user session handling

## Future Enhancements

- **Multi-Language Support**: Support for Java, C++, and other languages
- **Plagiarism Detection**: Code similarity analysis
- **Cloud Deployment**: Web-based version with cloud execution
- **Mobile App**: Companion mobile application
- **Advanced Analytics**: Machine learning-based insights

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support and questions:
- Create an issue on GitHub
- Contact the development team
- Check the documentation wiki

## Acknowledgments

- Built with JavaFX for modern desktop UI
- MySQL for reliable data storage
- Docker for secure code execution
- BCrypt for password security