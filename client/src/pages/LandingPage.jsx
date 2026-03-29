import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { FiPlus, FiMinus, FiMapPin, FiPhone, FiMail, FiSend, FiArrowRight, FiCheckCircle, FiSun, FiMoon } from 'react-icons/fi'
import { FaUserGraduate, FaChalkboardTeacher, FaUserTie } from 'react-icons/fa'
import { useTheme } from '../context/ThemeContext'
import { useI18n } from '../context/I18nContext'
import ShaderBackground from '../components/ui/ShaderBackground'
import './LandingPage.css'

// faqData moved to translations

function LandingPage() {
  const [activeIndex, setActiveIndex] = useState(null);
  const { theme, toggleTheme, isDark } = useTheme();
  const { translations, language, changeLanguage, t: translate } = useI18n();

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
                <option value="en">{t.common.languageNames.en}</option>
                <option value="hi">{t.common.languageNames.hi}</option>
              </select>
              <button
                className="theme-toggle"
                onClick={toggleTheme}
                aria-label={t.common.toggleTheme}
              >
                {isDark ? <FiSun size={16} /> : <FiMoon size={16} />}
              </button>
            </div>
            <Link to="/login" className="nav-link">{t.nav?.login || 'Login'}</Link>
            <Link to="/signup" className="nav-link btn-primary">{t.nav?.signup || 'Sign Up'}</Link>
          </div>
        </div>
      </motion.nav>

      {/* Hero section with animated shader background */}
      <div className="hero-wrapper">
        <ShaderBackground speed={0.6} intensity={1.2} activeEffect="mesh" isDark={isDark} />
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
            {/* Students Card */}
            <motion.div className="feature-card feature-card--student" variants={fadeInUp}>
              <div className="feature-card__accent" />
              <div className="feature-card__body">
                <div className="feature-card__icon-wrap feature-card__icon-wrap--student">
                  <FaUserGraduate />
                </div>
                <div className="feature-card__tag">{t.features.cardTags.students}</div>
                <h3 className="feature-card__title">{t.features?.students}</h3>
                <p className="feature-card__desc">{t.features?.studentsDesc}</p>
                <ul className="feature-card__list">
                  {t.features.listItems.students.map((item) => (
                    <li key={item}><FiCheckCircle /> {item}</li>
                  ))}
                </ul>
                <Link to="/signup" className="feature-card__cta">
                  {t.features.ctas.students} <FiArrowRight />
                </Link>
              </div>
            </motion.div>

            {/* Teachers Card */}
            <motion.div className="feature-card feature-card--teacher" variants={fadeInUp}>
              <div className="feature-card__accent feature-card__accent--teacher" />
              <div className="feature-card__body">
                <div className="feature-card__icon-wrap feature-card__icon-wrap--teacher">
                  <FaChalkboardTeacher />
                </div>
                <div className="feature-card__tag">{t.features.cardTags.teachers}</div>
                <h3 className="feature-card__title">{t.features?.teachers}</h3>
                <p className="feature-card__desc">{t.features?.teachersDesc}</p>
                <ul className="feature-card__list">
                  {t.features.listItems.teachers.map((item) => (
                    <li key={item}><FiCheckCircle /> {item}</li>
                  ))}
                </ul>
                <Link to="/signup" className="feature-card__cta feature-card__cta--teacher">
                  {t.features.ctas.teachers} <FiArrowRight />
                </Link>
              </div>
            </motion.div>

            {/* Admins Card */}
            <motion.div className="feature-card feature-card--admin" variants={fadeInUp}>
              <div className="feature-card__accent feature-card__accent--admin" />
              <div className="feature-card__body">
                <div className="feature-card__icon-wrap feature-card__icon-wrap--admin">
                  <FaUserTie />
                </div>
                <div className="feature-card__tag">{t.features.cardTags.admins}</div>
                <h3 className="feature-card__title">{t.features?.admins}</h3>
                <p className="feature-card__desc">{t.features?.adminsDesc}</p>
                <ul className="feature-card__list">
                  {t.features.listItems.admins.map((item) => (
                    <li key={item}><FiCheckCircle /> {item}</li>
                  ))}
                </ul>
                <Link to="/signup" className="feature-card__cta feature-card__cta--admin">
                  {t.features.ctas.admins} <FiArrowRight />
                </Link>
              </div>
            </motion.div>

          </motion.div>
        </motion.main>
      </div>

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
                <input type="text" placeholder={t.contact?.subjectPlaceholder} required />
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
