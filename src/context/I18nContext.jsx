import React, { createContext, useContext, useState, useEffect } from 'react'

const I18nContext = createContext()

export function useI18n() {
  return useContext(I18nContext)
}

const translations = {
  en: {
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
      adminsDesc: 'Oversee the entire system, manage users, and generate reports'
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
        fillFields: 'Please fill in all fields'
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
        passwordLength: 'Password must be at least 6 characters'
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
          newTeacher: 'New teacher added'
        }
      },
      student: {
        title: 'Student Dashboard',
        welcome: 'Welcome',
        header: 'My Lab Work',
        subtitle: 'View assignments, submit work, and track your progress',
        logout: 'Logout',
        stats: {
          assignments: 'Assignments',
          completed: 'Completed',
          pending: 'Pending',
          averageGrade: 'Average Grade'
        },
        sections: {
          currentAssignments: 'Current Assignments',
          currentAssignmentsDesc: 'View and work on your active lab assignments',
          viewAssignments: 'View Assignments',
          submitWork: 'Submit Work',
          submitWorkDesc: 'Upload your completed lab work and reports',
          submitWorkBtn: 'Submit Work',
          grades: 'Grades & Feedback',
          gradesDesc: 'Check your grades and teacher feedback',
          viewGrades: 'View Grades',
          resources: 'Lab Resources',
          resourcesDesc: 'Access lab materials, guides, and documentation',
          resourcesBtn: 'Resources'
        },
        activity: {
          title: 'Recent Assignments',
          dueTomorrow: 'Due: Tomorrow',
          dueDays: 'Due: {days} days',
          graded: 'Graded'
        }
      },
      teacher: {
        title: 'Teacher Dashboard',
        welcome: 'Welcome',
        header: 'Class Management',
        subtitle: 'Manage classes, grade assignments, and monitor student progress',
        logout: 'Logout',
        stats: {
          totalStudents: 'Total Students',
          activeClasses: 'Active Classes',
          pendingGrading: 'Pending Grading',
          avgPerformance: 'Avg. Performance'
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
          dayAgo: '1 day ago'
        }
      }
    }
  },
  hi: {
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
      adminsDesc: 'पूरे सिस्टम की देखरेख करें, उपयोगकर्ताओं को प्रबंधित करें और रिपोर्ट जेनरेट करें'
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
        fillFields: 'कृपया सभी फ़ील्ड भरें'
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
        passwordLength: 'पासवर्ड कम से कम 6 वर्ण का होना चाहिए'
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
          newTeacher: 'नया शिक्षक जोड़ा गया'
        }
      },
      student: {
        title: 'छात्र डैशबोर्ड',
        welcome: 'स्वागत है',
        header: 'मेरा लैब कार्य',
        subtitle: 'असाइनमेंट देखें, कार्य जमा करें और अपनी प्रगति को ट्रैक करें',
        logout: 'लॉगआउट',
        stats: {
          assignments: 'असाइनमेंट',
          completed: 'पूर्ण',
          pending: 'लंबित',
          averageGrade: 'औसत ग्रेड'
        },
        sections: {
          currentAssignments: 'वर्तमान असाइनमेंट',
          currentAssignmentsDesc: 'अपने सक्रिय लैब असाइनमेंट देखें और उन पर काम करें',
          viewAssignments: 'असाइनमेंट देखें',
          submitWork: 'कार्य जमा करें',
          submitWorkDesc: 'अपना पूर्ण लैब कार्य और रिपोर्ट अपलोड करें',
          submitWorkBtn: 'कार्य जमा करें',
          grades: 'ग्रेड और प्रतिक्रिया',
          gradesDesc: 'अपने ग्रेड और शिक्षक प्रतिक्रिया देखें',
          viewGrades: 'ग्रेड देखें',
          resources: 'लैब संसाधन',
          resourcesDesc: 'लैब सामग्री, गाइड और दस्तावेज़ीकरण तक पहुंचें',
          resourcesBtn: 'संसाधन'
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
        stats: {
          totalStudents: 'कुल छात्र',
          activeClasses: 'सक्रिय कक्षाएं',
          pendingGrading: 'लंबित ग्रेडिंग',
          avgPerformance: 'औसत प्रदर्शन'
        },
        sections: {
          createAssignment: 'असाइनमेंट बनाएं',
          createAssignmentDesc: 'अपने छात्रों के लिए नए लैब असाइनमेंट बनाएं',
          createAssignmentBtn: 'असाइनमेंट बनाएं',
          gradeSubmissions: 'जमा ग्रेड करें',
          gradeSubmissionsDesc: 'छात्र लैब कार्य जमा की समीक्षा करें और ग्रेड करें',
          gradeWork: 'कार्य ग्रेड करें',
          studentProgress: 'छात्र प्रगति',
          studentProgressDesc: 'व्यक्तिगत छात्र प्रगति और प्रदर्शन की निगरानी करें',
          viewProgress: 'प्रगति देखें',
          classResources: 'कक्षा संसाधन',
          classResourcesDesc: 'लैब सामग्री और संसाधन अपलोड करें और प्रबंधित करें',
          manageResources: 'संसाधन प्रबंधित करें'
        },
        activity: {
          title: 'हाल की जमा',
          submitted: 'जमा किया',
          hoursAgo: '{hours} घंटे पहले',
          dayAgo: '1 दिन पहले'
        }
      }
    }
  }
}

export function I18nProvider({ children }) {
  const [language, setLanguage] = useState(() => {
    const savedLang = localStorage.getItem('language')
    return savedLang || 'en'
  })

  useEffect(() => {
    localStorage.setItem('language', language)
  }, [language])

  const t = (key) => {
    const keys = key.split('.')
    let value = translations[language]
    for (const k of keys) {
      value = value?.[k]
    }
    return value || key
  }

  const changeLanguage = (lang) => {
    setLanguage(lang)
  }

  const value = {
    language,
    changeLanguage,
    t,
    translations: translations[language]
  }

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}
