export const translations = {
  en: {
    app: {
      loading: 'Loading...'
    },
    common: {
      languageNames: {
        en: 'EN',
        hi: 'हिं'
      },
      theme: 'Theme',
      toggleTheme: 'Toggle theme',
      loading: 'Loading...',
      cancel: 'Cancel',
      close: 'Close',
      create: 'Create',
      save: 'Save',
      update: 'Update',
      delete: 'Delete',
      remove: 'Remove',
      export: 'Export',
      upload: 'Upload',
      uploading: 'Uploading...',
      replace: 'Replace',
      add: 'Add',
      subject: 'Subject',
      description: 'Description',
      points: 'Points',
      files: 'Files',
      tasks: 'Tasks',
      students: 'Students',
      modules: 'Modules',
      rewards: 'Rewards',
      active: 'Active',
      general: 'General',
      unknown: 'Unknown',
      notAvailable: 'N/A',
      noDescription: 'No description provided.',
      unknownStudent: 'Unknown Student',
      unknownInstructor: 'Unknown',
      statuses: {
        ACTIVE: 'Active',
        APPROVED: 'Approved',
        PENDING: 'Pending',
        REJECTED: 'Rejected'
      },
      errors: {
        somethingWentWrong: 'Something went wrong'
      }
    },
    nav: {
      login: 'Login',
      signup: 'Sign Up'
    },
    hero: {
      title: 'Welcome to',
      subtitle: 'Manage your lab work, assignments, and resources all in one place. Designed for students, teachers, and administrators.',
      getStarted: 'Get Started',
      signIn: 'Sign In'
    },
    features: {
      students: 'For Students',
      studentsDesc: 'Access lab assignments, submit work, and track your progress',
      teachers: 'For Teachers',
      teachersDesc: 'Manage classes, grade assignments, and monitor student progress',
      admins: 'For Admins',
      adminsDesc: 'Oversee the entire system, manage users, and generate reports',
      cardTags: {
        students: 'For Students',
        teachers: 'For Teachers',
        admins: 'For Admins'
      },
      listItems: {
        students: [
          'Access assignments & lab tasks',
          'Track grades & progress',
          'Download course handouts'
        ],
        teachers: [
          'Create modules & tasks',
          'Grade student submissions',
          'Upload handouts & resources'
        ],
        admins: [
          'Manage users & roles',
          'Monitor system activity',
          'Generate reports'
        ]
      },
      ctas: {
        students: 'Get Started',
        teachers: 'Start Teaching',
        admins: 'Manage System'
      }
    },
    faq: {
      title: 'Frequently Asked',
      titleHighlight: 'Questions',
      subtitle: 'Got questions? We\'ve got answers!',
      items: [
        {
          question: 'How do I get started with SamVidyaa?',
          answer: 'Simply click the \'Sign Up\' button, choose your role (Student, Teacher, or Admin), fill in your details, and you\'re ready to go!'
        },
        {
          question: 'Can I change my role after signing up?',
          answer: 'Currently, role changes need to be made by an administrator. Contact support if you need to update your role.'
        },
        {
          question: 'Is SamVidyaa free to use?',
          answer: 'Yes! SamVidyaa is completely free for all students, teachers, and administrators.'
        },
        {
          question: 'How do I submit my lab assignments?',
          answer: 'Once logged in as a student, navigate to your dashboard and click on \'Submit Work\'. You can upload files and add descriptions.'
        },
        {
          question: 'What file formats are supported for submissions?',
          answer: 'We support PDF, DOC, DOCX, ZIP, and image files (JPG, PNG). Maximum file size is 10MB per submission.'
        },
        {
          question: 'How can teachers grade assignments?',
          answer: 'Teachers can access the \'Grade Submissions\' section from their dashboard, review student work, and provide feedback with grades.'
        }
      ]
    },
    contact: {
      title: 'Get in',
      titleHighlight: 'Touch',
      subtitle: 'Have questions or feedback? We\'d love to hear from you!',
      email: 'Email Us',
      emailValue: 'support@samvidyaa.com',
      phone: 'Call Us',
      phoneValue: '+1 (555) 123-4567',
      address: 'Visit Us',
      addressValue: '123 College Street, Campus Building',
      namePlaceholder: 'Your Name',
      emailPlaceholder: 'Your Email',
      subjectPlaceholder: 'Subject',
      messagePlaceholder: 'Your Message',
      sendButton: 'Send Message',
      successMessage: 'Thank you for contacting us! We\'ll get back to you soon.'
    },
    footer: {
      copyright: '© 2024 SamVidyaa. All rights reserved.'
    },
    auth: {
      login: {
        title: 'Welcome Back',
        subtitle: 'Sign in to your account',
        email: 'Email',
        password: 'Password',
        role: 'Role',
        emailPlaceholder: 'Enter your email',
        passwordPlaceholder: 'Enter your password',
        signIn: 'Sign In',
        noAccount: 'Don\'t have an account?',
        signUp: 'Sign up',
        backHome: '← Back to home',
        fillFields: 'Please fill in all fields',
        or: 'OR',
        continueWithGoogle: 'Continue with Google',
        signInWithGoogle: 'Sign in with Google'
      },
      signup: {
        title: 'Create Account',
        subtitle: 'Sign up to get started',
        name: 'Full Name',
        email: 'Email',
        password: 'Password',
        confirmPassword: 'Confirm Password',
        role: 'Role',
        namePlaceholder: 'Enter your full name',
        emailPlaceholder: 'Enter your email',
        passwordPlaceholder: 'Create a password',
        confirmPasswordPlaceholder: 'Confirm your password',
        signUp: 'Sign Up',
        haveAccount: 'Already have an account?',
        signIn: 'Sign in',
        backHome: '← Back to home',
        fillFields: 'Please fill in all fields',
        passwordMismatch: 'Passwords do not match',
        passwordLength: 'Password must be at least 6 characters',
        continueWithGoogle: 'Sign up with Google'
      },
      roles: {
        student: 'Student',
        teacher: 'Teacher',
        admin: 'Admin'
      }
    },
    dashboard: {
      admin: {
        title: 'Admin Dashboard',
        welcome: 'Welcome',
        header: 'System Overview',
        subtitle: 'Manage users, labs, and system settings',
        logout: 'Logout',
        stats: {
          totalUsers: 'Total Users',
          students: 'Students',
          teachers: 'Teachers',
          activeLabs: 'Active Labs'
        },
        sections: {
          userManagement: 'User Management',
          userManagementDesc: 'Add, edit, or remove users from the system',
          manageUsers: 'Manage Users',
          labManagement: 'Lab Management',
          labManagementDesc: 'Create and manage lab sessions and resources',
          manageLabs: 'Manage Labs',
          reports: 'Reports & Analytics',
          reportsDesc: 'View system reports and analytics',
          viewReports: 'View Reports',
          settings: 'System Settings',
          settingsDesc: 'Configure system-wide settings and preferences',
          settingsBtn: 'Settings'
        },
        activity: {
          title: 'Recent Activity',
          newStudent: 'New student registered',
          assignmentSubmitted: 'Lab assignment submitted',
          newTeacher: 'New teacher added',
          hoursAgo: '{hours} hours ago',
          dayAgo: '1 day ago'
        }
      },
      student: {
        title: 'Student Dashboard',
        welcome: 'Welcome',
        header: 'My Lab Work',
        subtitle: 'View assignments, submit work, and track your progress',
        logout: 'Logout',
        roleLabel: 'Student',
        tabs: {
          dashboard: 'Dashboard',
          myCourses: 'My Courses',
          availableCourses: 'Available Courses',
          pointShop: 'Point Shop',
          rankings: 'Rankings'
        },
        topbar: {
          welcomeBack: 'Welcome Back, {name}',
          openPointShop: 'Open Point Shop',
          totalPoints: 'Total Points'
        },
        stats: {
          assignments: 'Assignments',
          completed: 'Completed',
          pending: 'Pending',
          averageGrade: 'Average Grade',
          quickStats: 'Quick Stats',
          enrolledCourses: 'Enrolled Courses',
          pendingRequests: 'Pending Requests',
          available: 'Available',
          pointsEarned: 'Points Earned'
        },
        collaboration: {
          pendingRequests: 'Pending Collaboration Requests',
          requestMessage: '{name} wants to team up for {task} in {course}.',
          accept: 'Accept',
          decline: 'Decline',
          updateFailed: 'Failed to update request'
        },
        courses: {
          title: 'My Backpack',
          loading: 'Loading...',
          empty: 'You are not enrolled in any courses yet.',
          requestPending: 'Request Pending',
          notEnrolled: 'Not Enrolled',
          active: 'Active',
          downloadHandout: 'Download Handout',
          openCourse: 'Open Course'
        },
        availableCourses: {
          title: 'Course Catalog',
          loading: 'Loading...',
          empty: 'No new courses available at the moment.',
          subject: 'Subject: {subject}',
          requestEnrollment: 'Request Enrollment',
          requesting: 'Requesting...',
          enrollSuccess: 'Enrolled successfully!',
          enrollFailed: 'Enrollment failed'
        },
        pointShop: {
          title: 'Fun Zone Rewards',
          earnTestPoints: 'Earn 50 Points (Test)',
          loading: 'Loading fresh rewards...',
          empty: 'No custom rewards available. Keep an eye out for updates from your teachers!',
          course: 'Course: {course}',
          cost: '{points} pts',
          claiming: 'Claiming...',
          locked: 'Locked',
          claim: 'Claim',
          claimSuccess: 'Reward claimed successfully!',
          claimFailed: 'Failed to claim reward',
          claimError: 'Error claiming reward'
        },
        leaderboard: {
          title: 'Class Rankings',
          rank: 'Rank',
          student: 'Student',
          score: 'Score',
          yourRank: 'You',
          points: 'pts',
          options: {
            global: 'Global Ranking',
            weekly: 'Weekly Top',
            class: 'Class Ranking',
            peers: 'My Peers'
          },
          selectClass: '-- Select a Class --',
          loading: 'Loading rankings...',
          selectClassPrompt: 'Select a class to view its ranking.',
          empty: 'No data available for this ranking.'
        },
        courseModal: {
          coursePoints: '{points} Course Points',
          moduleCount: '{count} Modules',
          handout: 'Handout',
          close: 'Close',
          syllabusLoading: 'Loading syllabus...',
          empty: 'No modules available for this course yet.',
          moduleLabel: 'Module {order}',
          moduleNumber: 'Module {order}',
          taskCount: 'Tasks ({count})',
          loadingTasks: 'Loading tasks...',
          noTasks: 'No tasks assigned yet.',
          teamworkAllowed: 'Teamwork Allowed',
          askForCollaboration: 'Ask for Collaboration',
          complete: 'Complete',
          downloadFailed: 'Download failed'
        },
        activity: {
          title: 'Recent Assignments',
          dueTomorrow: 'Due: Tomorrow',
          dueDays: 'Due: {days} days',
          graded: 'Graded'
        }
      },
      teacher: {
        title: 'INSTRUCTOR',
        welcome: 'Welcome',
        header: 'Class Management',
        subtitle: 'Manage classes, grade assignments, and monitor student progress',
        logout: 'Logout',
        roleLabel: 'Teacher',
        tabs: {
          dashboard: 'Dashboard',
          myCourses: 'My Courses'
        },
        topbar: {
          welcomeBack: 'Welcome, {name}'
        },
        stats: {
          totalStudents: 'Total Students',
          activeClasses: 'Active Classes',
          pendingGrading: 'Pending Grading',
          avgPerformance: 'Avg. Performance',
          quickStats: 'Quick Stats'
        },
        sections: {
          createAssignment: 'Create Assignment',
          createAssignmentDesc: 'Create new lab assignments for your students',
          createAssignmentBtn: 'Create Assignment',
          gradeSubmissions: 'Grade Submissions',
          gradeSubmissionsDesc: 'Review and grade student lab work submissions',
          gradeWork: 'Grade Work',
          studentProgress: 'Student Progress',
          studentProgressDesc: 'Monitor individual student progress and performance',
          viewProgress: 'View Progress',
          classResources: 'Class Resources',
          classResourcesDesc: 'Upload and manage lab materials and resources',
          manageResources: 'Manage Resources'
        },
        activity: {
          title: 'Recent Submissions',
          submitted: 'submitted',
          hoursAgo: '{hours} hours ago',
          dayAgo: '1 day ago',
          quickLog: [
            { name: 'John Doe', lab: 'Lab 5', hours: 2 },
            { name: 'Jane Smith', lab: 'Lab 5', hours: 5 },
            { name: 'Bob Johnson', lab: 'Lab 4', dayAgo: true }
          ]
        },
        courses: {
          title: 'My Courses',
          createCourse: 'Create Course',
          analytics: 'Analytics',
          empty: 'No courses created yet.',
          instructorWorkspace: 'Instructor Workspace',
          questionCount: 'Q: {count}',
          exportCourse: 'Export Course',
          deleteCourse: 'Delete Course',
          openCourse: 'Open Course',
          backToCourses: '← Back to Courses',
          students: 'Students',
          rewards: 'Rewards',
          addModule: 'Add Module',
          modulesCount: '{count} Modules',
          tasksCount: '{count} Tasks',
          summaries: {
            modules: 'Modules',
            modulesDesc: 'Structured learning blocks in this course',
            tasks: 'Tasks',
            tasksDesc: 'Total assignments published across modules',
            resources: 'Resources',
            resourcesDesc: 'Files attached across your teaching flow',
            coursePoints: 'Course Points',
            coursePointsDesc: 'Reward value configured for the course journey'
          }
        },
        analyticsModal: {
          title: 'Course Analytics',
          subtitle: 'cohort performance and learning signals',
          close: 'Close',
          loading: 'Loading course analytics...',
          unavailable: 'Analytics are unavailable for this course right now.',
          limitedData: 'Detailed progress records are limited right now. These insights are based on enrollments plus any saved progress snapshots.',
          overview: {
            activeLearners: 'Active Learners',
            avgCompletion: 'Avg Completion',
            avgScore: 'Avg Score',
            supportNeeded: 'Needs Support'
          },
          highlights: {
            topPerformer: 'Top Performer',
            bottleneck: 'Bottleneck Module'
          },
          charts: {
            topPerformers: 'Top Performers',
            moduleProgress: 'Module Progress',
            attentionNeeded: 'Learners Needing Attention',
            studentSnapshot: 'Student Snapshot'
          },
          fields: {
            completion: 'Completion',
            score: 'Score',
            engagement: 'Engagement',
            started: 'Started',
            completed: 'Completed',
            lastActivity: 'Last activity'
          },
          progressBands: {
            completed: 'Completed',
            on_track: 'On Track',
            steady: 'Steady',
            needs_support: 'Needs Support',
            not_started: 'Not Started'
          },
          emptyStudents: 'No learner analytics available yet.',
          emptyModules: 'No module analytics available yet.',
          emptyAttention: 'No learners are currently flagged for support.',
          noRecentActivity: 'No recent update'
        },
        handout: {
          none: 'No handout uploaded',
          upload: 'Upload Handout (PDF)',
          replace: 'Replace',
          remove: 'Remove',
          removeConfirm: 'Remove the uploaded handout?',
          uploadFailed: 'Upload failed',
          removeFailed: 'Failed to remove handout',
          removeError: 'Error removing handout'
        },
        modules: {
          title: 'Modules',
          description: 'Organize the course into clear learning blocks with tasks and resources.',
          loading: 'Loading modules...',
          empty: 'No modules in this course.',
          moduleLabel: 'Module {order}',
          noDescription: 'No module description added yet.',
          filesCount: '{count} Files',
          tasksCount: '{count} Tasks',
          order: 'Order #{order}',
          viewTasks: 'View Tasks',
          addTask: 'Add Task',
          export: 'Export',
          exportModule: 'Export Module',
          delete: 'Delete',
          deleteModule: 'Delete Module'
        },
        taskView: {
          backToModules: '← Back to Modules',
          moduleLabel: 'Module #{order}',
          totalPoints: '{count} Total Points',
          avgTime: '{count} min avg time',
          createTask: 'Create Task',
          summaries: {
            tasks: 'Tasks',
            tasksDesc: 'Published coding tasks inside this module',
            points: 'Points',
            pointsDesc: 'Total points available across all tasks',
            languages: 'Languages',
            languagesDesc: 'Distinct programming languages currently used',
            timeProfile: 'Time Profile',
            timeProfileDesc: 'Average suggested time limit for completion'
          },
          title: 'Tasks',
          description: 'Review, edit, and maintain the coding challenges for this module.',
          loading: 'Loading tasks...',
          empty: 'No tasks in this module.',
          language: 'Lang: {language}',
          time: 'Time: {time}m',
          tests: 'Tests: {count}',
          constraints: 'Constraints:',
          editTask: 'Edit Task',
          deleteTask: 'Delete Task'
        },
        studentsModal: {
          enrolledStudents: 'Enrolled Students ({count})',
          addStudents: 'Add Students',
          close: 'Close',
          loading: 'Loading students...',
          empty: 'No students enrolled yet.',
          approve: 'Approve',
          reject: 'Reject'
        },
        alerts: {
          updateStatusFailed: 'Failed to update status',
          updateStatusError: 'Error updating status',
          confirmDeleteCourse: 'Are you sure you want to delete this course?',
          deleteCourseFailed: 'Failed to delete course',
          deleteCourseError: 'Error deleting course',
          courseAnalyticsFailed: 'Failed to load course analytics',
          confirmDeleteModule: 'Are you sure you want to delete this module?',
          deleteModuleFailed: 'Failed to delete module',
          deleteModuleError: 'Error deleting module',
          confirmDeleteTask: 'Are you sure you want to delete this task?',
          deleteTaskFailed: 'Failed to delete task',
          deleteTaskError: 'Error deleting task',
          courseExportFailed: 'Course export failed',
          moduleExportFailed: 'Module export failed'
        }
      }
    },
    forms: {
      course: {
        title: 'Create New Course',
        courseName: 'Course Name',
        courseNamePlaceholder: 'e.g., Intro to Python',
        courseCode: 'Course Code',
        courseCodePlaceholder: 'e.g., CS101',
        subject: 'Subject',
        subjectPlaceholder: 'e.g., Computer Science',
        coursePoints: 'Course Points',
        description: 'Description',
        descriptionPlaceholder: 'Course details...',
        cancel: 'Cancel',
        create: 'Create Course',
        creating: 'Creating...',
        createFailed: 'Failed to create course'
      },
      module: {
        title: 'Create New Module',
        moduleOrder: 'Module Order',
        moduleName: 'Module Name',
        moduleNamePlaceholder: 'e.g., Variables',
        description: 'Description',
        descriptionPlaceholder: 'Module details...',
        tasksCount: 'Tasks Count',
        testQuestions: 'Test Questions',
        modulePoints: 'Module Points',
        status: 'Status',
        active: 'Active',
        resources: 'Resources (Files)',
        cancel: 'Cancel',
        create: 'Create Module',
        creating: 'Creating...',
        required: 'Module name and order are required.',
        createFailed: 'Failed to create module'
      },
      task: {
        createTitle: 'Create New Task',
        editTitle: 'Edit Task',
        taskName: 'Task Name',
        taskNamePlaceholder: 'e.g., Calculate Sum',
        difficulty: 'Difficulty',
        difficulties: {
          EASY: 'Easy',
          MEDIUM: 'Medium',
          HARD: 'Hard'
        },
        basePoints: 'Base Points',
        timeLimit: 'Time Limit (mins)',
        language: 'Language',
        allowCollaboration: 'Allow Collaboration',
        collaborationHelp: 'If enabled, students can choose to share their reward points with peers who helped them.',
        peerShare: 'Peer Share Percentage (%)',
        problemStatement: 'Problem Statement',
        problemStatementPlaceholder: 'Describe the task...',
        expectedOutput: 'Expected Output Description (Optional)',
        expectedOutputPlaceholder: 'Description of expected output...',
        sampleInput: 'Sample Input (Text)',
        sampleInputPlaceholder: 'Input example...',
        sampleOutput: 'Sample Output (Text)',
        sampleOutputPlaceholder: 'Output example...',
        constraints: 'Constraints',
        constraintsPlaceholder: 'e.g., Use O(n) time complexity',
        testCases: 'Test Cases',
        testCaseInput: 'Input',
        testCaseExpectedOutput: 'Expected Output',
        sample: 'Sample',
        hidden: 'Hidden',
        add: 'Add',
        remove: 'Remove',
        cancel: 'Cancel',
        create: 'Create Task',
        update: 'Update Task',
        saving: 'Saving...',
        required: 'Task name and problem statement are required.',
        testCaseRequired: 'Input and Expected Output are required for a test case.',
        createFailed: 'Failed to create task',
        updateFailed: 'Failed to update task',
        createdSuccess: 'Task created successfully!',
        updatedSuccess: 'Task updated successfully!'
      },
      addStudents: {
        title: 'Add Students',
        byRange: 'By Enrollment Range',
        uploadExcel: 'Upload Excel',
        rangeHelp: 'Enter a range of enrollment numbers to enroll all matching students into this course.',
        fromEnrollment: 'From Enrollment Number',
        toEnrollment: 'To Enrollment Number',
        enrollmentPlaceholderStart: 'e.g. 220101',
        enrollmentPlaceholderEnd: 'e.g. 220150',
        excelHelp: 'Upload an Excel file containing list of students. File must include email and enrollment number columns.',
        selectExcel: 'Select Excel File (.xlsx, .xls, .csv)',
        cancel: 'Cancel',
        enrolling: 'Enrolling...',
        enrollStudents: 'Enroll Students',
        uploading: 'Uploading...',
        uploadAndEnroll: 'Upload & Enroll',
        rangeRequired: 'Both enrollment numbers are required',
        excelRequired: 'Please select an Excel file',
        bulkFailed: 'Bulk enrollment failed',
        excelFailed: 'Excel upload failed',
        enrolled: '{count} enrolled',
        skipped: '{count} skipped',
        notFound: '{count} not found',
        foundInRange: '{count} found in range'
      },
      rewards: {
        manageTitle: 'Manage Course Rewards',
        close: 'Close',
        addNew: 'Add New Reward',
        rewardTitle: 'Reward Title',
        rewardTitlePlaceholder: 'e.g. Pizza Party',
        description: 'Description',
        descriptionPlaceholder: 'Brief description of the reward',
        cost: 'Cost (Points)',
        icon: 'Icon',
        icons: {
          HiGift: 'Gift Box',
          HiCheckBadge: 'Badge',
          HiClock: 'Clock',
          HiLightBulb: 'Light Bulb',
          HiSwatch: 'Paint Swatch',
          HiBolt: 'Lightning Bolt',
          HiIdentification: 'Certificate'
        },
        addReward: 'Add Reward',
        adding: 'Adding...',
        availableRewards: 'Available Rewards ({count})',
        loading: 'Loading rewards...',
        empty: 'No rewards added to this course yet. Add one to give your students something to strive for!',
        deleteReward: 'Delete Reward',
        confirmDelete: 'Are you sure you want to delete this reward?',
        required: 'Please fill out all fields.',
        createFailed: 'Failed to create reward',
        deleteFailed: 'Failed to delete reward',
        deleteError: 'Error deleting reward'
      },
      completeTask: {
        title: 'Submit Task: {task}',
        totalPoints: 'This task is worth a total of {points} points.',
        collaborationMode: 'Collaboration Mode',
        collaborationInfo: 'Your teacher has enabled collaboration for this task with a {percentage}% sharing split.',
        collaborationSummary: 'Because you selected {count} peer(s), you will earn {studentShare} points, and each peer will receive {peerShare} points!',
        selectCollaborators: 'Select Collaborators (Optional)',
        loadingClassmates: 'Loading classmates...',
        noClassmates: 'No other students found in this class.',
        cancel: 'Cancel',
        submitting: 'Submitting...',
        markComplete: 'Mark as Complete',
        completeSuccess: 'Task marked as complete!',
        completeFailed: 'Failed to complete task'
      },
      collaboration: {
        title: 'Find a Partner',
        task: 'Task: {task}',
        loading: 'Finding classmates...',
        empty: 'No other active students found in this course.',
        inviting: 'Sending...',
        invite: 'Invite',
        close: 'Close',
        loadFailed: 'Failed to load peers.',
        inviteSuccess: 'Invitation sent successfully!',
        inviteFailed: 'Failed to send invitation.'
      }
    }
  },
  hi: {
    app: {
      loading: 'लोड हो रहा है...'
    },
    common: {
      languageNames: {
        en: 'EN',
        hi: 'हिं'
      },
      theme: 'थीम',
      toggleTheme: 'थीम बदलें',
      loading: 'लोड हो रहा है...',
      cancel: 'रद्द करें',
      close: 'बंद करें',
      create: 'बनाएं',
      save: 'सहेजें',
      update: 'अपडेट करें',
      delete: 'हटाएं',
      remove: 'निकालें',
      export: 'एक्सपोर्ट',
      upload: 'अपलोड',
      uploading: 'अपलोड हो रहा है...',
      replace: 'बदलें',
      add: 'जोड़ें',
      subject: 'विषय',
      description: 'विवरण',
      points: 'अंक',
      files: 'फाइलें',
      tasks: 'कार्य',
      students: 'छात्र',
      modules: 'मॉड्यूल',
      rewards: 'रिवॉर्ड्स',
      active: 'सक्रिय',
      general: 'सामान्य',
      unknown: 'अज्ञात',
      notAvailable: 'उपलब्ध नहीं',
      noDescription: 'कोई विवरण उपलब्ध नहीं है।',
      unknownStudent: 'अज्ञात छात्र',
      unknownInstructor: 'अज्ञात',
      statuses: {
        ACTIVE: 'सक्रिय',
        APPROVED: 'स्वीकृत',
        PENDING: 'लंबित',
        REJECTED: 'अस्वीकृत'
      },
      errors: {
        somethingWentWrong: 'कुछ गलत हो गया'
      }
    },
    nav: {
      login: 'लॉग इन',
      signup: 'साइन अप'
    },
    hero: {
      title: 'स्वागत है',
      subtitle: 'अपने लैब कार्य, असाइनमेंट और संसाधनों को एक ही स्थान पर प्रबंधित करें। छात्रों, शिक्षकों और प्रशासकों के लिए डिज़ाइन किया गया।',
      getStarted: 'शुरू करें',
      signIn: 'साइन इन'
    },
    features: {
      students: 'छात्रों के लिए',
      studentsDesc: 'लैब असाइनमेंट तक पहुंचें, कार्य जमा करें और अपनी प्रगति को ट्रैक करें',
      teachers: 'शिक्षकों के लिए',
      teachersDesc: 'कक्षाओं को प्रबंधित करें, असाइनमेंट ग्रेड करें और छात्र प्रगति की निगरानी करें',
      admins: 'प्रशासकों के लिए',
      adminsDesc: 'पूरे सिस्टम की देखरेख करें, उपयोगकर्ताओं को प्रबंधित करें और रिपोर्ट जेनरेट करें',
      cardTags: {
        students: 'छात्रों के लिए',
        teachers: 'शिक्षकों के लिए',
        admins: 'प्रशासकों के लिए'
      },
      listItems: {
        students: [
          'असाइनमेंट और लैब कार्य देखें',
          'ग्रेड और प्रगति ट्रैक करें',
          'कोर्स हैंडआउट डाउनलोड करें'
        ],
        teachers: [
          'मॉड्यूल और कार्य बनाएं',
          'छात्र सबमिशन जाँचें',
          'हैंडआउट और संसाधन अपलोड करें'
        ],
        admins: [
          'उपयोगकर्ता और भूमिकाएँ प्रबंधित करें',
          'सिस्टम गतिविधि मॉनिटर करें',
          'रिपोर्ट जेनरेट करें'
        ]
      },
      ctas: {
        students: 'शुरू करें',
        teachers: 'शिक्षण शुरू करें',
        admins: 'सिस्टम प्रबंधित करें'
      }
    },
    faq: {
      title: 'अक्सर पूछे जाने वाले',
      titleHighlight: 'प्रश्न',
      subtitle: 'प्रश्न हैं? हमारे पास उत्तर हैं!',
      items: [
        {
          question: 'मैं SamVidyaa के साथ कैसे शुरुआत करूं?',
          answer: 'बस \'साइन अप\' बटन पर क्लिक करें, अपनी भूमिका चुनें (छात्र, शिक्षक, या प्रशासक), अपनी जानकारी भरें, और आप तैयार हैं!'
        },
        {
          question: 'क्या मैं साइन अप के बाद अपनी भूमिका बदल सकता हूं?',
          answer: 'वर्तमान में, भूमिका परिवर्तन एक प्रशासक द्वारा किए जाने की आवश्यकता है। यदि आपको अपनी भूमिका अपडेट करने की आवश्यकता है तो सपोर्ट से संपर्क करें।'
        },
        {
          question: 'क्या SamVidyaa उपयोग करने के लिए मुफ्त है?',
          answer: 'हाँ! SamVidyaa सभी छात्रों, शिक्षकों और प्रशासकों के लिए पूरी तरह से मुफ्त है।'
        },
        {
          question: 'मैं अपने लैब असाइनमेंट कैसे जमा करूं?',
          answer: 'एक बार छात्र के रूप में लॉग इन करने के बाद, अपने डैशबोर्ड पर नेविगेट करें और \'कार्य जमा करें\' पर क्लिक करें। आप फ़ाइलें अपलोड कर सकते हैं और विवरण जोड़ सकते हैं।'
        },
        {
          question: 'जमा करने के लिए कौन से फ़ाइल प्रारूप समर्थित हैं?',
          answer: 'हम PDF, DOC, DOCX, ZIP और छवि फ़ाइलें (JPG, PNG) का समर्थन करते हैं। अधिकतम फ़ाइल आकार प्रति जमा 10MB है।'
        },
        {
          question: 'शिक्षक असाइनमेंट कैसे ग्रेड कर सकते हैं?',
          answer: 'शिक्षक अपने डैशबोर्ड से \'ग्रेड जमा\' अनुभाग तक पहुंच सकते हैं, छात्र कार्य की समीक्षा कर सकते हैं और ग्रेड के साथ प्रतिक्रिया प्रदान कर सकते हैं।'
        }
      ]
    },
    contact: {
      title: 'संपर्क में',
      titleHighlight: 'रहें',
      subtitle: 'प्रश्न या प्रतिक्रिया है? हम आपसे सुनना पसंद करेंगे!',
      email: 'हमें ईमेल करें',
      emailValue: 'support@samvidyaa.com',
      phone: 'हमें कॉल करें',
      phoneValue: '+1 (555) 123-4567',
      address: 'हमसे मिलें',
      addressValue: '123 कॉलेज स्ट्रीट, कैंपस बिल्डिंग',
      namePlaceholder: 'आपका नाम',
      emailPlaceholder: 'आपका ईमेल',
      subjectPlaceholder: 'विषय',
      messagePlaceholder: 'आपका संदेश',
      sendButton: 'संदेश भेजें',
      successMessage: 'हमसे संपर्क करने के लिए धन्यवाद! हम जल्द ही आपसे संपर्क करेंगे।'
    },
    footer: {
      copyright: '© 2024 SamVidyaa. सभी अधिकार सुरक्षित।'
    },
    auth: {
      login: {
        title: 'वापसी पर स्वागत है',
        subtitle: 'अपने खाते में साइन इन करें',
        email: 'ईमेल',
        password: 'पासवर्ड',
        role: 'भूमिका',
        emailPlaceholder: 'अपना ईमेल दर्ज करें',
        passwordPlaceholder: 'अपना पासवर्ड दर्ज करें',
        signIn: 'साइन इन',
        noAccount: 'खाता नहीं है?',
        signUp: 'साइन अप करें',
        backHome: '← होम पर वापस जाएं',
        fillFields: 'कृपया सभी फ़ील्ड भरें',
        or: 'या',
        continueWithGoogle: 'Google के साथ जारी रखें',
        signInWithGoogle: 'Google के साथ साइन इन करें'
      },
      signup: {
        title: 'खाता बनाएं',
        subtitle: 'शुरू करने के लिए साइन अप करें',
        name: 'पूरा नाम',
        email: 'ईमेल',
        password: 'पासवर्ड',
        confirmPassword: 'पासवर्ड की पुष्टि करें',
        role: 'भूमिका',
        namePlaceholder: 'अपना पूरा नाम दर्ज करें',
        emailPlaceholder: 'अपना ईमेल दर्ज करें',
        passwordPlaceholder: 'एक पासवर्ड बनाएं',
        confirmPasswordPlaceholder: 'अपने पासवर्ड की पुष्टि करें',
        signUp: 'साइन अप करें',
        haveAccount: 'पहले से खाता है?',
        signIn: 'साइन इन करें',
        backHome: '← होम पर वापस जाएं',
        fillFields: 'कृपया सभी फ़ील्ड भरें',
        passwordMismatch: 'पासवर्ड मेल नहीं खाते',
        passwordLength: 'पासवर्ड कम से कम 6 वर्ण का होना चाहिए',
        continueWithGoogle: 'Google के साथ साइन अप करें'
      },
      roles: {
        student: 'छात्र',
        teacher: 'शिक्षक',
        admin: 'प्रशासक'
      }
    },
    dashboard: {
      admin: {
        title: 'प्रशासक डैशबोर्ड',
        welcome: 'स्वागत है',
        header: 'सिस्टम अवलोकन',
        subtitle: 'उपयोगकर्ताओं, लैब और सिस्टम सेटिंग्स को प्रबंधित करें',
        logout: 'लॉगआउट',
        stats: {
          totalUsers: 'कुल उपयोगकर्ता',
          students: 'छात्र',
          teachers: 'शिक्षक',
          activeLabs: 'सक्रिय लैब'
        },
        sections: {
          userManagement: 'उपयोगकर्ता प्रबंधन',
          userManagementDesc: 'सिस्टम से उपयोगकर्ताओं को जोड़ें, संपादित करें या हटाएं',
          manageUsers: 'उपयोगकर्ता प्रबंधित करें',
          labManagement: 'लैब प्रबंधन',
          labManagementDesc: 'लैब सत्र और संसाधन बनाएं और प्रबंधित करें',
          manageLabs: 'लैब प्रबंधित करें',
          reports: 'रिपोर्ट और विश्लेषण',
          reportsDesc: 'सिस्टम रिपोर्ट और विश्लेषण देखें',
          viewReports: 'रिपोर्ट देखें',
          settings: 'सिस्टम सेटिंग्स',
          settingsDesc: 'सिस्टम-व्यापी सेटिंग्स और प्राथमिकताएं कॉन्फ़िगर करें',
          settingsBtn: 'सेटिंग्स'
        },
        activity: {
          title: 'हाल की गतिविधि',
          newStudent: 'नया छात्र पंजीकृत',
          assignmentSubmitted: 'लैब असाइनमेंट जमा किया गया',
          newTeacher: 'नया शिक्षक जोड़ा गया',
          hoursAgo: '{hours} घंटे पहले',
          dayAgo: '1 दिन पहले'
        }
      },
      student: {
        title: 'छात्र डैशबोर्ड',
        welcome: 'स्वागत है',
        header: 'मेरा लैब कार्य',
        subtitle: 'असाइनमेंट देखें, कार्य जमा करें और अपनी प्रगति को ट्रैक करें',
        logout: 'लॉगआउट',
        roleLabel: 'छात्र',
        tabs: {
          dashboard: 'डैशबोर्ड',
          myCourses: 'मेरे कोर्स',
          availableCourses: 'उपलब्ध कोर्स',
          pointShop: 'पॉइंट शॉप',
          rankings: 'रैंकिंग'
        },
        topbar: {
          welcomeBack: 'स्वागत है, {name}',
          openPointShop: 'पॉइंट शॉप खोलें',
          totalPoints: 'कुल अंक'
        },
        stats: {
          assignments: 'असाइनमेंट',
          completed: 'पूर्ण',
          pending: 'लंबित',
          averageGrade: 'औसत ग्रेड',
          quickStats: 'त्वरित आँकड़े',
          enrolledCourses: 'नामांकित कोर्स',
          pendingRequests: 'लंबित अनुरोध',
          available: 'उपलब्ध',
          pointsEarned: 'अर्जित अंक'
        },
        collaboration: {
          pendingRequests: 'लंबित सहयोग अनुरोध',
          requestMessage: '{name} {course} में {task} के लिए साथ काम करना चाहता/चाहती है।',
          accept: 'स्वीकार करें',
          decline: 'अस्वीकार करें',
          updateFailed: 'अनुरोध अपडेट नहीं हो सका'
        },
        courses: {
          title: 'मेरा बैकपैक',
          loading: 'लोड हो रहा है...',
          empty: 'आप अभी किसी भी कोर्स में नामांकित नहीं हैं।',
          requestPending: 'अनुरोध लंबित',
          notEnrolled: 'नामांकन नहीं हुआ',
          active: 'सक्रिय',
          downloadHandout: 'हैंडआउट डाउनलोड करें',
          openCourse: 'कोर्स खोलें'
        },
        availableCourses: {
          title: 'कोर्स कैटलॉग',
          loading: 'लोड हो रहा है...',
          empty: 'इस समय कोई नया कोर्स उपलब्ध नहीं है।',
          subject: 'विषय: {subject}',
          requestEnrollment: 'नामांकन का अनुरोध करें',
          requesting: 'अनुरोध भेजा जा रहा है...',
          enrollSuccess: 'सफलतापूर्वक नामांकन हो गया!',
          enrollFailed: 'नामांकन विफल रहा'
        },
        pointShop: {
          title: 'फन ज़ोन रिवॉर्ड्स',
          earnTestPoints: '50 अंक कमाएँ (टेस्ट)',
          loading: 'नए रिवॉर्ड्स लोड हो रहे हैं...',
          empty: 'इस समय कोई कस्टम रिवॉर्ड उपलब्ध नहीं है। अपने शिक्षकों की अपडेट्स पर नज़र रखें!',
          course: 'कोर्स: {course}',
          cost: '{points} अंक',
          claiming: 'क्लेम किया जा रहा है...',
          locked: 'लॉक्ड',
          claim: 'क्लेम करें',
          claimSuccess: 'रिवॉर्ड सफलतापूर्वक क्लेम किया गया!',
          claimFailed: 'रिवॉर्ड क्लेम नहीं हो सका',
          claimError: 'रिवॉर्ड क्लेम करने में त्रुटि'
        },
        leaderboard: {
          title: 'कक्षा रैंकिंग',
          rank: 'रैंक',
          student: 'छात्र',
          score: 'स्कोर',
          yourRank: 'आप',
          points: 'अंक',
          options: {
            global: 'वैश्विक रैंकिंग',
            weekly: 'साप्ताहिक शीर्ष',
            class: 'कक्षा रैंकिंग',
            peers: 'मेरे साथी'
          },
          selectClass: '-- कक्षा चुनें --',
          loading: 'रैंकिंग लोड हो रही है...',
          selectClassPrompt: 'रैंकिंग देखने के लिए कक्षा चुनें।',
          empty: 'इस रैंकिंग के लिए कोई डेटा उपलब्ध नहीं है।'
        },
        courseModal: {
          coursePoints: '{points} कोर्स अंक',
          moduleCount: '{count} मॉड्यूल',
          handout: 'हैंडआउट',
          close: 'बंद करें',
          syllabusLoading: 'सिलेबस लोड हो रहा है...',
          empty: 'इस कोर्स के लिए अभी कोई मॉड्यूल उपलब्ध नहीं है।',
          moduleLabel: 'मॉड्यूल {order}',
          moduleNumber: 'मॉड्यूल {order}',
          taskCount: 'कार्य ({count})',
          loadingTasks: 'कार्य लोड हो रहे हैं...',
          noTasks: 'अभी कोई कार्य असाइन नहीं किया गया है।',
          teamworkAllowed: 'टीमवर्क अनुमत',
          askForCollaboration: 'सहयोग के लिए पूछें',
          complete: 'पूर्ण करें',
          downloadFailed: 'डाउनलोड विफल रहा'
        },
        activity: {
          title: 'हाल के असाइनमेंट',
          dueTomorrow: 'नियत: कल',
          dueDays: 'नियत: {days} दिन',
          graded: 'ग्रेडेड'
        }
      },
      teacher: {
        title: 'शिक्षक डैशबोर्ड',
        welcome: 'स्वागत है',
        header: 'कक्षा प्रबंधन',
        subtitle: 'कक्षाओं को प्रबंधित करें, असाइनमेंट ग्रेड करें और छात्र प्रगति की निगरानी करें',
        logout: 'लॉगआउट',
        roleLabel: 'शिक्षक',
        tabs: {
          dashboard: 'डैशबोर्ड',
          myCourses: 'मेरे कोर्स'
        },
        topbar: {
          welcomeBack: 'स्वागत है, {name}'
        },
        stats: {
          totalStudents: 'कुल छात्र',
          activeClasses: 'सक्रिय कक्षाएं',
          pendingGrading: 'लंबित ग्रेडिंग',
          avgPerformance: 'औसत प्रदर्शन',
          quickStats: 'त्वरित आँकड़े'
        },
        sections: {
          createAssignment: 'असाइनमेंट बनाएं',
          createAssignmentDesc: 'अपने छात्रों के लिए नए लैब असाइनमेंट बनाएं',
          createAssignmentBtn: 'असाइनमेंट बनाएं',
          gradeSubmissions: 'जमा कार्य जाँचें',
          gradeSubmissionsDesc: 'छात्र लैब कार्य जमा की समीक्षा करें और ग्रेड करें',
          gradeWork: 'कार्य जाँचें',
          studentProgress: 'छात्र प्रगति',
          studentProgressDesc: 'व्यक्तिगत छात्र प्रगति और प्रदर्शन की निगरानी करें',
          viewProgress: 'प्रगति देखें',
          classResources: 'कक्षा संसाधन',
          classResourcesDesc: 'लैब सामग्री और संसाधन अपलोड करें और प्रबंधित करें',
          manageResources: 'संसाधन प्रबंधित करें'
        },
        activity: {
          title: 'हाल की सबमिशन',
          submitted: 'ने जमा किया',
          hoursAgo: '{hours} घंटे पहले',
          dayAgo: '1 दिन पहले',
          quickLog: [
            { name: 'John Doe', lab: 'Lab 5', hours: 2 },
            { name: 'Jane Smith', lab: 'Lab 5', hours: 5 },
            { name: 'Bob Johnson', lab: 'Lab 4', dayAgo: true }
          ]
        },
        courses: {
          title: 'मेरे कोर्स',
          createCourse: 'कोर्स बनाएं',
          analytics: 'एनालिटिक्स',
          empty: 'अभी तक कोई कोर्स नहीं बनाया गया है।',
          instructorWorkspace: 'इंस्ट्रक्टर वर्कस्पेस',
          questionCount: 'प्रश्न: {count}',
          exportCourse: 'कोर्स एक्सपोर्ट करें',
          deleteCourse: 'कोर्स हटाएं',
          openCourse: 'कोर्स खोलें',
          backToCourses: '← कोर्स पर वापस जाएं',
          students: 'छात्र',
          rewards: 'रिवॉर्ड्स',
          addModule: 'मॉड्यूल जोड़ें',
          modulesCount: '{count} मॉड्यूल',
          tasksCount: '{count} कार्य',
          summaries: {
            modules: 'मॉड्यूल',
            modulesDesc: 'इस कोर्स के संरचित शिक्षण ब्लॉक्स',
            tasks: 'कार्य',
            tasksDesc: 'मॉड्यूल्स में प्रकाशित कुल असाइनमेंट',
            resources: 'संसाधन',
            resourcesDesc: 'आपके शिक्षण प्रवाह में जुड़ी फाइलें',
            coursePoints: 'कोर्स अंक',
            coursePointsDesc: 'कोर्स यात्रा के लिए निर्धारित रिवॉर्ड मूल्य'
          }
        },
        analyticsModal: {
          title: 'कोर्स एनालिटिक्स',
          subtitle: 'बैच प्रदर्शन और सीखने के संकेत',
          close: 'बंद करें',
          loading: 'कोर्स एनालिटिक्स लोड हो रहा है...',
          unavailable: 'इस कोर्स के लिए एनालिटिक्स अभी उपलब्ध नहीं है।',
          limitedData: 'विस्तृत प्रगति रिकॉर्ड अभी सीमित हैं। ये आँकड़े नामांकन और उपलब्ध प्रगति स्नैपशॉट्स पर आधारित हैं।',
          overview: {
            activeLearners: 'सक्रिय शिक्षार्थी',
            avgCompletion: 'औसत पूर्णता',
            avgScore: 'औसत स्कोर',
            supportNeeded: 'सहायता आवश्यक'
          },
          highlights: {
            topPerformer: 'शीर्ष प्रदर्शनकर्ता',
            bottleneck: 'रुकावट वाला मॉड्यूल'
          },
          charts: {
            topPerformers: 'शीर्ष प्रदर्शनकर्ता',
            moduleProgress: 'मॉड्यूल प्रगति',
            attentionNeeded: 'ध्यान चाहने वाले छात्र',
            studentSnapshot: 'छात्र स्नैपशॉट'
          },
          fields: {
            completion: 'पूर्णता',
            score: 'स्कोर',
            engagement: 'सक्रियता',
            started: 'शुरू',
            completed: 'पूर्ण',
            lastActivity: 'अंतिम गतिविधि'
          },
          progressBands: {
            completed: 'पूर्ण',
            on_track: 'सही प्रगति',
            steady: 'स्थिर',
            needs_support: 'सहायता आवश्यक',
            not_started: 'शुरू नहीं किया'
          },
          emptyStudents: 'अभी कोई छात्र एनालिटिक्स उपलब्ध नहीं है।',
          emptyModules: 'अभी कोई मॉड्यूल एनालिटिक्स उपलब्ध नहीं है।',
          emptyAttention: 'अभी किसी छात्र को अतिरिक्त सहायता के लिए चिह्नित नहीं किया गया है।',
          noRecentActivity: 'हाल की कोई अपडेट नहीं'
        },
        handout: {
          none: 'कोई हैंडआउट अपलोड नहीं किया गया',
          upload: 'हैंडआउट अपलोड करें (PDF)',
          replace: 'बदलें',
          remove: 'हटाएं',
          removeConfirm: 'अपलोड किया गया हैंडआउट हटाना है?',
          uploadFailed: 'अपलोड विफल रहा',
          removeFailed: 'हैंडआउट हटाया नहीं जा सका',
          removeError: 'हैंडआउट हटाने में त्रुटि'
        },
        modules: {
          title: 'मॉड्यूल',
          description: 'कार्य और संसाधनों के साथ कोर्स को स्पष्ट शिक्षण ब्लॉक्स में व्यवस्थित करें।',
          loading: 'मॉड्यूल लोड हो रहे हैं...',
          empty: 'इस कोर्स में कोई मॉड्यूल नहीं है।',
          moduleLabel: 'मॉड्यूल {order}',
          noDescription: 'अभी कोई मॉड्यूल विवरण नहीं जोड़ा गया है।',
          filesCount: '{count} फाइलें',
          tasksCount: '{count} कार्य',
          order: 'क्रम #{order}',
          viewTasks: 'कार्य देखें',
          addTask: 'कार्य जोड़ें',
          export: 'एक्सपोर्ट',
          exportModule: 'मॉड्यूल एक्सपोर्ट करें',
          delete: 'हटाएं',
          deleteModule: 'मॉड्यूल हटाएं'
        },
        taskView: {
          backToModules: '← मॉड्यूल पर वापस जाएं',
          moduleLabel: 'मॉड्यूल #{order}',
          totalPoints: '{count} कुल अंक',
          avgTime: '{count} मिनट औसत समय',
          createTask: 'कार्य बनाएं',
          summaries: {
            tasks: 'कार्य',
            tasksDesc: 'इस मॉड्यूल के अंदर प्रकाशित कोडिंग कार्य',
            points: 'अंक',
            pointsDesc: 'सभी कार्यों में उपलब्ध कुल अंक',
            languages: 'भाषाएँ',
            languagesDesc: 'वर्तमान में उपयोग की जा रही अलग-अलग प्रोग्रामिंग भाषाएँ',
            timeProfile: 'समय प्रोफ़ाइल',
            timeProfileDesc: 'पूर्ण करने के लिए औसत सुझाई गई समय सीमा'
          },
          title: 'कार्य',
          description: 'इस मॉड्यूल के कोडिंग चुनौतियों की समीक्षा करें, संपादित करें और बनाए रखें।',
          loading: 'कार्य लोड हो रहे हैं...',
          empty: 'इस मॉड्यूल में कोई कार्य नहीं है।',
          language: 'भाषा: {language}',
          time: 'समय: {time}मि',
          tests: 'टेस्ट: {count}',
          constraints: 'सीमाएँ:',
          editTask: 'कार्य संपादित करें',
          deleteTask: 'कार्य हटाएं'
        },
        studentsModal: {
          enrolledStudents: 'नामांकित छात्र ({count})',
          addStudents: 'छात्र जोड़ें',
          close: 'बंद करें',
          loading: 'छात्र लोड हो रहे हैं...',
          empty: 'अभी तक कोई छात्र नामांकित नहीं है।',
          approve: 'स्वीकृत करें',
          reject: 'अस्वीकृत करें'
        },
        alerts: {
          updateStatusFailed: 'स्थिति अपडेट नहीं हो सकी',
          updateStatusError: 'स्थिति अपडेट करने में त्रुटि',
          confirmDeleteCourse: 'क्या आप वाकई इस कोर्स को हटाना चाहते हैं?',
          deleteCourseFailed: 'कोर्स हटाया नहीं जा सका',
          deleteCourseError: 'कोर्स हटाने में त्रुटि',
          courseAnalyticsFailed: 'कोर्स एनालिटिक्स लोड नहीं हो सका',
          confirmDeleteModule: 'क्या आप वाकई इस मॉड्यूल को हटाना चाहते हैं?',
          deleteModuleFailed: 'मॉड्यूल हटाया नहीं जा सका',
          deleteModuleError: 'मॉड्यूल हटाने में त्रुटि',
          confirmDeleteTask: 'क्या आप वाकई इस कार्य को हटाना चाहते हैं?',
          deleteTaskFailed: 'कार्य हटाया नहीं जा सका',
          deleteTaskError: 'कार्य हटाने में त्रुटि',
          courseExportFailed: 'कोर्स एक्सपोर्ट विफल रहा',
          moduleExportFailed: 'मॉड्यूल एक्सपोर्ट विफल रहा'
        }
      }
    },
    forms: {
      course: {
        title: 'नया कोर्स बनाएं',
        courseName: 'कोर्स नाम',
        courseNamePlaceholder: 'जैसे, Python का परिचय',
        courseCode: 'कोर्स कोड',
        courseCodePlaceholder: 'जैसे, CS101',
        subject: 'विषय',
        subjectPlaceholder: 'जैसे, कंप्यूटर साइंस',
        coursePoints: 'कोर्स अंक',
        description: 'विवरण',
        descriptionPlaceholder: 'कोर्स विवरण...',
        cancel: 'रद्द करें',
        create: 'कोर्स बनाएं',
        creating: 'बनाया जा रहा है...',
        createFailed: 'कोर्स नहीं बनाया जा सका'
      },
      module: {
        title: 'नया मॉड्यूल बनाएं',
        moduleOrder: 'मॉड्यूल क्रम',
        moduleName: 'मॉड्यूल नाम',
        moduleNamePlaceholder: 'जैसे, Variables',
        description: 'विवरण',
        descriptionPlaceholder: 'मॉड्यूल विवरण...',
        tasksCount: 'कार्य संख्या',
        testQuestions: 'टेस्ट प्रश्न',
        modulePoints: 'मॉड्यूल अंक',
        status: 'स्थिति',
        active: 'सक्रिय',
        resources: 'संसाधन (फाइलें)',
        cancel: 'रद्द करें',
        create: 'मॉड्यूल बनाएं',
        creating: 'बनाया जा रहा है...',
        required: 'मॉड्यूल नाम और क्रम आवश्यक हैं।',
        createFailed: 'मॉड्यूल नहीं बनाया जा सका'
      },
      task: {
        createTitle: 'नया कार्य बनाएं',
        editTitle: 'कार्य संपादित करें',
        taskName: 'कार्य नाम',
        taskNamePlaceholder: 'जैसे, Calculate Sum',
        difficulty: 'कठिनाई',
        difficulties: {
          EASY: 'आसान',
          MEDIUM: 'मध्यम',
          HARD: 'कठिन'
        },
        basePoints: 'मूल अंक',
        timeLimit: 'समय सीमा (मिनट)',
        language: 'भाषा',
        allowCollaboration: 'सहयोग की अनुमति दें',
        collaborationHelp: 'यदि यह सक्षम है, तो छात्र उनकी मदद करने वाले साथियों के साथ अपने रिवॉर्ड अंक साझा कर सकते हैं।',
        peerShare: 'साथी शेयर प्रतिशत (%)',
        problemStatement: 'समस्या विवरण',
        problemStatementPlaceholder: 'कार्य का विवरण लिखें...',
        expectedOutput: 'अपेक्षित आउटपुट विवरण (वैकल्पिक)',
        expectedOutputPlaceholder: 'अपेक्षित आउटपुट का विवरण...',
        sampleInput: 'नमूना इनपुट (टेक्स्ट)',
        sampleInputPlaceholder: 'इनपुट उदाहरण...',
        sampleOutput: 'नमूना आउटपुट (टेक्स्ट)',
        sampleOutputPlaceholder: 'आउटपुट उदाहरण...',
        constraints: 'सीमाएँ',
        constraintsPlaceholder: 'जैसे, O(n) समय जटिलता का उपयोग करें',
        testCases: 'टेस्ट केस',
        testCaseInput: 'इनपुट',
        testCaseExpectedOutput: 'अपेक्षित आउटपुट',
        sample: 'नमूना',
        hidden: 'गुप्त',
        add: 'जोड़ें',
        remove: 'हटाएं',
        cancel: 'रद्द करें',
        create: 'कार्य बनाएं',
        update: 'कार्य अपडेट करें',
        saving: 'सहेजा जा रहा है...',
        required: 'कार्य नाम और समस्या विवरण आवश्यक हैं।',
        testCaseRequired: 'टेस्ट केस के लिए इनपुट और अपेक्षित आउटपुट आवश्यक हैं।',
        createFailed: 'कार्य नहीं बनाया जा सका',
        updateFailed: 'कार्य अपडेट नहीं किया जा सका',
        createdSuccess: 'कार्य सफलतापूर्वक बनाया गया!',
        updatedSuccess: 'कार्य सफलतापूर्वक अपडेट किया गया!'
      },
      addStudents: {
        title: 'छात्र जोड़ें',
        byRange: 'नामांकन रेंज से',
        uploadExcel: 'Excel अपलोड करें',
        rangeHelp: 'इस कोर्स में सभी मिलते-जुलते छात्रों को नामांकित करने के लिए नामांकन नंबर की रेंज दर्ज करें।',
        fromEnrollment: 'नामांकन संख्या से',
        toEnrollment: 'नामांकन संख्या तक',
        enrollmentPlaceholderStart: 'जैसे 220101',
        enrollmentPlaceholderEnd: 'जैसे 220150',
        excelHelp: 'छात्रों की सूची वाली Excel फाइल अपलोड करें। फाइल में email और enrollment number कॉलम होने चाहिए।',
        selectExcel: 'Excel फाइल चुनें (.xlsx, .xls, .csv)',
        cancel: 'रद्द करें',
        enrolling: 'नामांकन हो रहा है...',
        enrollStudents: 'छात्र नामांकित करें',
        uploading: 'अपलोड हो रहा है...',
        uploadAndEnroll: 'अपलोड और नामांकन करें',
        rangeRequired: 'दोनों नामांकन संख्याएँ आवश्यक हैं',
        excelRequired: 'कृपया एक Excel फाइल चुनें',
        bulkFailed: 'बल्क नामांकन विफल रहा',
        excelFailed: 'Excel अपलोड विफल रहा',
        enrolled: '{count} नामांकित',
        skipped: '{count} छोड़े गए',
        notFound: '{count} नहीं मिले',
        foundInRange: '{count} रेंज में मिले'
      },
      rewards: {
        manageTitle: 'कोर्स रिवॉर्ड्स प्रबंधित करें',
        close: 'बंद करें',
        addNew: 'नया रिवॉर्ड जोड़ें',
        rewardTitle: 'रिवॉर्ड शीर्षक',
        rewardTitlePlaceholder: 'जैसे Pizza Party',
        description: 'विवरण',
        descriptionPlaceholder: 'रिवॉर्ड का संक्षिप्त विवरण',
        cost: 'लागत (अंक)',
        icon: 'आइकन',
        icons: {
          HiGift: 'गिफ्ट बॉक्स',
          HiCheckBadge: 'बैज',
          HiClock: 'घड़ी',
          HiLightBulb: 'लाइट बल्ब',
          HiSwatch: 'पेंट स्वैच',
          HiBolt: 'बिजली चिन्ह',
          HiIdentification: 'प्रमाणपत्र'
        },
        addReward: 'रिवॉर्ड जोड़ें',
        adding: 'जोड़ा जा रहा है...',
        availableRewards: 'उपलब्ध रिवॉर्ड्स ({count})',
        loading: 'रिवॉर्ड्स लोड हो रहे हैं...',
        empty: 'इस कोर्स में अभी कोई रिवॉर्ड नहीं जोड़ा गया है। अपने छात्रों को प्रेरित करने के लिए एक जोड़ें!',
        deleteReward: 'रिवॉर्ड हटाएं',
        confirmDelete: 'क्या आप वाकई इस रिवॉर्ड को हटाना चाहते हैं?',
        required: 'कृपया सभी फ़ील्ड भरें।',
        createFailed: 'रिवॉर्ड नहीं बनाया जा सका',
        deleteFailed: 'रिवॉर्ड हटाया नहीं जा सका',
        deleteError: 'रिवॉर्ड हटाने में त्रुटि'
      },
      completeTask: {
        title: 'कार्य जमा करें: {task}',
        totalPoints: 'यह कार्य कुल {points} अंकों का है।',
        collaborationMode: 'सहयोग मोड',
        collaborationInfo: 'आपके शिक्षक ने इस कार्य के लिए {percentage}% शेयरिंग विभाजन के साथ सहयोग सक्षम किया है।',
        collaborationSummary: 'क्योंकि आपने {count} साथी चुने हैं, आपको {studentShare} अंक मिलेंगे और प्रत्येक साथी को {peerShare} अंक मिलेंगे!',
        selectCollaborators: 'सहयोगी चुनें (वैकल्पिक)',
        loadingClassmates: 'सहपाठी लोड हो रहे हैं...',
        noClassmates: 'इस कक्षा में कोई अन्य छात्र नहीं मिला।',
        cancel: 'रद्द करें',
        submitting: 'जमा किया जा रहा है...',
        markComplete: 'पूर्ण चिह्नित करें',
        completeSuccess: 'कार्य सफलतापूर्वक पूर्ण चिह्नित किया गया!',
        completeFailed: 'कार्य पूर्ण नहीं हो सका'
      },
      collaboration: {
        title: 'साथी खोजें',
        task: 'कार्य: {task}',
        loading: 'सहपाठी खोजे जा रहे हैं...',
        empty: 'इस कोर्स में कोई अन्य सक्रिय छात्र नहीं मिला।',
        inviting: 'भेजा जा रहा है...',
        invite: 'आमंत्रित करें',
        close: 'बंद करें',
        loadFailed: 'साथियों को लोड नहीं किया जा सका।',
        inviteSuccess: 'आमंत्रण सफलतापूर्वक भेजा गया!',
        inviteFailed: 'आमंत्रण नहीं भेजा जा सका।'
      }
    }
  }
}
