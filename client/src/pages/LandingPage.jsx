import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { FiPlus, FiMinus, FiMapPin, FiPhone, FiMail, FiSend } from 'react-icons/fi'
import { FaUserGraduate, FaChalkboardTeacher, FaUserTie } from 'react-icons/fa'
import { useTheme } from '../context/ThemeContext'
import { useI18n } from '../context/I18nContext'
import './LandingPage.css'

// faqData moved to translations

function LandingPage() {
  const [activeIndex, setActiveIndex] = useState(null);
  const { theme, toggleTheme, isDark } = useTheme();
  const { language, changeLanguage } = useI18n();

  const { translations } = useI18n();

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

  const t = translations;

  return (
    <div className="landing-page" data-theme={theme}>
      <motion.nav
        className="navbar"
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.8 }}
      >
        <div className="nav-container">
          <h1 className="logo">SamVidyaa</h1>
          <div className="nav-links">
            <div className="nav-controls">
              <select
                className="language-selector"
                value={language}
                onChange={(e) => changeLanguage(e.target.value)}
              >
                <option value="en">EN</option>
                <option value="hi">हिं</option>
              </select>
              <button
                className="theme-toggle"
                onClick={toggleTheme}
                aria-label="Toggle theme"
              >
                {isDark ? '☀️' : '🌙'}
              </button>
            </div>
            <Link to="/login" className="nav-link">{t.nav?.login || 'Login'}</Link>
            <Link to="/signup" className="nav-link btn-primary">{t.nav?.signup || 'Sign Up'}</Link>
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
          <motion.h1 className="hero-title" variants={fadeInUp}>{t.hero?.title} SamVidyaa</motion.h1>
          <motion.p className="hero-subtitle" variants={fadeInUp}>
            {t.hero?.subtitle}
          </motion.p>
          <motion.div className="hero-buttons" variants={fadeInUp}>
            <Link to="/signup" className="btn btn-large btn-primary">
              {t.hero?.getStarted}
            </Link>
            <Link to="/login" className="btn btn-large btn-secondary">
              {t.hero?.signIn}
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
            <h3>{t.features?.students}</h3>
            <p>{t.features?.studentsDesc}</p>
          </motion.div>
          <motion.div className="feature-card" variants={fadeInUp}>
            <div className="feature-icon">
              <FaChalkboardTeacher />
            </div>
            <h3>{t.features?.teachers}</h3>
            <p>{t.features?.teachersDesc}</p>
          </motion.div>
          <motion.div className="feature-card" variants={fadeInUp}>
            <div className="feature-icon">
              <FaUserTie />
            </div>
            <h3>{t.features?.admins}</h3>
            <p>{t.features?.adminsDesc}</p>
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
          <motion.h2 className="section-title" variants={fadeInUp}>{t.faq?.title} <span className="highlight">{t.faq?.titleHighlight}</span></motion.h2>
          <motion.p className="section-subtitle" variants={fadeInUp}>{t.faq?.subtitle}</motion.p>

          <div className="faq-container">
            {t.faq?.items?.map((faq, index) => (
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
          <motion.h2 className="section-title" variants={fadeInUp}>{t.contact?.title} <span className="highlight">{t.contact?.titleHighlight}</span></motion.h2>
          <motion.p className="section-subtitle" variants={fadeInUp}>{t.contact?.subtitle}</motion.p>

          <div className="contact-container">
            <motion.div className="contact-info" variants={fadeInUp}>
              <div className="contact-item">
                <div className="contact-icon">
                  <FiMapPin />
                </div>
                <div>
                  <h3>{t.contact?.address}</h3>
                  <p>{t.contact?.addressValue}</p>
                </div>
              </div>

              <div className="contact-item">
                <div className="contact-icon">
                  <FiPhone />
                </div>
                <div>
                  <h3>{t.contact?.phone}</h3>
                  <p>{t.contact?.phoneValue}</p>
                </div>
              </div>

              <div className="contact-item">
                <div className="contact-icon">
                  <FiMail />
                </div>
                <div>
                  <h3>{t.contact?.email}</h3>
                  <p>{t.contact?.emailValue}</p>
                </div>
              </div>
            </motion.div>

            <motion.form
              className="contact-form"
              onSubmit={(e) => e.preventDefault()}
              variants={fadeInUp}
            >
              <div className="form-group">
                <input type="text" placeholder={t.contact?.namePlaceholder} required />
              </div>
              <div className="form-group">
                <input type="email" placeholder={t.contact?.emailPlaceholder} required />
              </div>
              <div className="form-group">
                <input type="text" placeholder="Subject" required />
              </div>
              <div className="form-group">
                <textarea placeholder={t.contact?.messagePlaceholder} required></textarea>
              </div>
              <button type="submit" className="btn btn-primary btn-full">
                {t.contact?.sendButton} <FiSend style={{ marginLeft: '0.5rem' }} />
              </button>
            </motion.form>
          </div>
        </div>
      </motion.section>



      <footer className="footer">
        <p>{t.footer?.copyright}</p>
      </footer>
    </div>
  )
}

export default LandingPage
