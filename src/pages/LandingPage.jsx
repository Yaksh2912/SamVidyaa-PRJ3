import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { FiPlus, FiMinus, FiMapPin, FiPhone, FiMail, FiSend } from 'react-icons/fi'
import { FaUserGraduate, FaChalkboardTeacher, FaUserTie } from 'react-icons/fa'
import './LandingPage.css'

const faqData = [
  {
    question: "How do I register for a new account?",
    answer: "Click on the 'Sign Up' button in the top right corner. Select whether you are a student or teacher, fill in your details using your university email address, and verify your account through the email sent to you."
  },
  {
    question: "Can I access my lab assignments from home?",
    answer: "Yes! SamVidyaa is cloud-based, allowing you to access your assignments, submit work, and view grades from any device with an internet connection, anywhere in the world."
  },
  {
    question: "How do teachers grade submissions?",
    answer: "Teachers have a dedicated dashboard where they can view student submissions, provide inline feedback, assign grades, and track class performance analytics in real-time."
  },
  {
    question: "Is there a plagiarism checker included?",
    answer: "Yes, we have integrated a basic code similarity checker that helps teachers identify potential plagiarism in code submissions across the class."
  }
];

function LandingPage() {
  const [activeIndex, setActiveIndex] = useState(null);

  const toggleFAQ = (index) => {
    setActiveIndex(activeIndex === index ? null : index);
  };

  const fadeInUp = {
    hidden: { opacity: 0, y: 60 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6, ease: "easeOut" }
    }
  };

  const staggerContainer = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2
      }
    }
  };

  return (
    <div className="landing-page">
      <motion.nav
        className="navbar"
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.8 }}
      >
        <div className="nav-container">
          <h1 className="logo">SamVidyaa</h1>
          <div className="nav-links">
            <Link to="/login" className="nav-link">Login</Link>
            <Link to="/signup" className="nav-link btn-primary">Sign Up</Link>
          </div>
        </div>
      </motion.nav>

      <motion.main
        className="hero"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: false, amount: 0.3 }}
        variants={staggerContainer}
      >
        <div className="hero-content">
          <motion.h1 className="hero-title" variants={fadeInUp}>Welcome to SamVidyaa</motion.h1>
          <motion.p className="hero-subtitle" variants={fadeInUp}>
            Manage your lab work, assignments, and resources all in one place.
            Designed for students, teachers, and administrators.
          </motion.p>
          <motion.div className="hero-buttons" variants={fadeInUp}>
            <Link to="/signup" className="btn btn-large btn-primary">
              Get Started
            </Link>
            <Link to="/login" className="btn btn-large btn-secondary">
              Sign In
            </Link>
          </motion.div>
        </div>

        <motion.div
          className="features"
          variants={staggerContainer}
        >
          <motion.div className="feature-card" variants={fadeInUp}>
            <div className="feature-icon">
              <FaUserGraduate />
            </div>
            <h3>For Students</h3>
            <p>Access lab assignments, submit work, and track your progress</p>
          </motion.div>
          <motion.div className="feature-card" variants={fadeInUp}>
            <div className="feature-icon">
              <FaChalkboardTeacher />
            </div>
            <h3>For Teachers</h3>
            <p>Manage classes, grade assignments, and monitor student progress</p>
          </motion.div>
          <motion.div className="feature-card" variants={fadeInUp}>
            <div className="feature-icon">
              <FaUserTie />
            </div>
            <h3>For Admins</h3>
            <p>Oversee the entire system, manage users, and generate reports</p>
          </motion.div>
        </motion.div>
      </motion.main>

      <motion.section
        className="faq-section"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: false, amount: 0.3 }}
        variants={staggerContainer}
      >
        <div className="section-container">
          <motion.h2 className="section-title" variants={fadeInUp}>Frequently Asked Questions</motion.h2>
          <motion.p className="section-subtitle" variants={fadeInUp}>Find answers to common questions about SamVidyaa</motion.p>

          <div className="faq-container">
            {faqData.map((faq, index) => (
              <motion.div
                key={index}
                className={`faq-item ${activeIndex === index ? 'active' : ''}`}
                variants={fadeInUp}
              >
                <button className="faq-question" onClick={() => toggleFAQ(index)}>
                  {faq.question}
                  <span className="faq-icon">
                    {activeIndex === index ? <FiMinus /> : <FiPlus />}
                  </span>
                </button>
                <div
                  className="faq-answer"
                  style={{
                    maxHeight: activeIndex === index ? '200px' : '0',
                    paddingBottom: activeIndex === index ? '1.5rem' : '0'
                  }}
                >
                  <p>{faq.answer}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.section>

      <motion.section
        className="contact-section"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: false, amount: 0.3 }}
        variants={staggerContainer}
      >
        <div className="section-container">
          <motion.h2 className="section-title" variants={fadeInUp}>Get in Touch</motion.h2>
          <motion.p className="section-subtitle" variants={fadeInUp}>Have questions? We'd love to hear from you.</motion.p>

          <div className="contact-container">
            <motion.div className="contact-info" variants={fadeInUp}>
              <div className="contact-item">
                <div className="contact-icon">
                  <FiMapPin />
                </div>
                <div>
                  <h3>Our Location</h3>
                  <p>123 Education Lane, Tech District<br />Mumbai, Maharashtra 400001</p>
                </div>
              </div>

              <div className="contact-item">
                <div className="contact-icon">
                  <FiPhone />
                </div>
                <div>
                  <h3>Phone Number</h3>
                  <p>+91 98765 43210</p>
                  <p>+91 22 1234 5678</p>
                </div>
              </div>

              <div className="contact-item">
                <div className="contact-icon">
                  <FiMail />
                </div>
                <div>
                  <h3>Email Address</h3>
                  <p>support@samvidyaa.edu</p>
                  <p>info@samvidyaa.edu</p>
                </div>
              </div>
            </motion.div>

            <motion.form
              className="contact-form"
              onSubmit={(e) => e.preventDefault()}
              variants={fadeInUp}
            >
              <div className="form-group">
                <input type="text" placeholder="Your Name" required />
              </div>
              <div className="form-group">
                <input type="email" placeholder="Your Email" required />
              </div>
              <div className="form-group">
                <input type="text" placeholder="Subject" required />
              </div>
              <div className="form-group">
                <textarea placeholder="Your Message" required></textarea>
              </div>
              <button type="submit" className="btn btn-primary btn-full">
                Send Message <FiSend style={{ marginLeft: '0.5rem' }} />
              </button>
            </motion.form>
          </div>
        </div>
      </motion.section>



      <footer className="footer">
        <p>&copy; 2024 SamVidyaa. All rights reserved.</p>
      </footer>
    </div>
  )
}

export default LandingPage
