import React, { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { FiPlus, FiMinus, FiMapPin, FiPhone, FiMail, FiSend, FiArrowRight, FiCheckCircle, FiSun, FiMoon, FiBook, FiUsers, FiAward, FiClock, FiUser, FiSearch, FiTrendingUp } from 'react-icons/fi'
import { FaUserGraduate, FaChalkboardTeacher, FaUserTie, FaQuoteLeft, FaGithub, FaTwitter, FaLinkedin } from 'react-icons/fa'
import { useTheme } from '../context/ThemeContext'
import { useI18n } from '../context/I18nContext'
import ShaderBackground from '../components/ui/ShaderBackground'
import './LandingPage.css'

/* ─── Animated Counter Hook ─── */
function useCounter(end, duration = 2000, startCounting) {
  const [count, setCount] = useState(0)
  useEffect(() => {
    if (!startCounting) return
    const numericEnd = parseInt(end)
    if (isNaN(numericEnd)) { setCount(end); return }
    let start = 0
    const increment = numericEnd / (duration / 16)
    const timer = setInterval(() => {
      start += increment
      if (start >= numericEnd) { setCount(numericEnd); clearInterval(timer) }
      else setCount(Math.floor(start))
    }, 16)
    return () => clearInterval(timer)
  }, [end, duration, startCounting])
  return typeof count === 'number' ? count : end
}

function StatItem({ value, label, suffix = '', icon }) {
  const ref = useRef(null)
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const observer = new IntersectionObserver(([e]) => { if (e.isIntersecting) setVisible(true) }, { threshold: 0.5 })
    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [])
  const count = useCounter(value, 1800, visible)
  return (
    <div className="stat-ribbon__item" ref={ref}>
      <div className="stat-ribbon__icon">{icon}</div>
      <span className="stat-ribbon__number">{count}{suffix}</span>
      <span className="stat-ribbon__label">{label}</span>
    </div>
  )
}

function LandingPage() {
  const [activeIndex, setActiveIndex] = useState(null)
  const { theme, toggleTheme, isDark } = useTheme()
  const { language, changeLanguage, translations } = useI18n()

  const toggleFAQ = (index) => setActiveIndex(activeIndex === index ? null : index)

  const fadeInUp = {
    hidden: { opacity: 0, y: 50 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' } }
  }
  const staggerContainer = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.15 } }
  }
  const scaleIn = {
    hidden: { opacity: 0, scale: 0.9 },
    visible: { opacity: 1, scale: 1, transition: { duration: 0.5, ease: 'easeOut' } }
  }

  const t = translations

  return (
    <div className="landing-page" data-theme={theme}>
      {/* ═══════ NAVBAR ═══════ */}
      <motion.nav className="navbar" initial={{ y: -100 }} animate={{ y: 0 }} transition={{ duration: 0.7 }}>
        <div className="nav-container">
          <h1 className="logo">SamVidyaa</h1>
          <div className="nav-center">
            <a href="#features" className="nav-anchor">Features</a>
            <a href="#how-it-works" className="nav-anchor">How It Works</a>
            <a href="#testimonials" className="nav-anchor">Testimonials</a>
            <a href="#contact" className="nav-anchor">Contact</a>
          </div>
          <div className="nav-links">
            <div className="nav-controls">
              <select className="language-selector" value={language} onChange={(e) => changeLanguage(e.target.value)}>
                <option value="en">EN</option>
                <option value="hi">हिं</option>
              </select>
              <button className="theme-toggle" onClick={toggleTheme} aria-label="Toggle theme">
                {isDark ? <FiSun size={16} /> : <FiMoon size={16} />}
              </button>
            </div>
            <Link to="/login" className="nav-link">{t.nav?.login || 'Login'}</Link>
            <Link to="/signup" className="nav-link btn-primary">{t.nav?.signup || 'Sign Up'}</Link>
          </div>
        </div>
      </motion.nav>

      {/* ═══════ HERO ═══════ */}
      <div className="hero-wrapper">
        <ShaderBackground speed={0.6} intensity={1.2} activeEffect="mesh" isDark={isDark} />
        <motion.main className="hero" initial="hidden" whileInView="visible" viewport={{ once: false, amount: 0.3 }} variants={staggerContainer}>
          <div className="hero-split">
            <div className="hero-text">
              <motion.h1 className="hero-title" variants={fadeInUp}>{t.hero?.title} <span className="hero-brand">SamVidyaa</span></motion.h1>
              <motion.p className="hero-subtitle" variants={fadeInUp}>{t.hero?.subtitle}</motion.p>
              <motion.div className="hero-buttons" variants={fadeInUp}>
                <Link to="/signup" className="btn btn-large btn-primary">{t.hero?.getStarted} <FiArrowRight /></Link>
                <Link to="/login" className="btn btn-large btn-secondary">{t.hero?.signIn}</Link>
              </motion.div>
            </div>
            <motion.div className="hero-illustration" variants={scaleIn}>
              <div className="hero-float">
                <div className="float-shape float-shape--1"><FiBook size={28} /></div>
                <div className="float-shape float-shape--2"><FiAward size={24} /></div>
                <div className="float-shape float-shape--3"><FiUsers size={26} /></div>
                <div className="float-shape float-shape--4"><FiTrendingUp size={22} /></div>
                <div className="float-orb float-orb--main"></div>
                <div className="float-orb float-orb--sm1"></div>
                <div className="float-orb float-orb--sm2"></div>
              </div>
            </motion.div>
          </div>
        </motion.main>
      </div>

      {/* ═══════ STATS RIBBON ═══════ */}
      <section className="stats-ribbon">
        <div className="stats-ribbon__inner">
          <StatItem value="500" suffix="+" label={t.stats?.studentsLabel} icon={<FiUsers />} />
          <StatItem value="50" suffix="+" label={t.stats?.coursesLabel} icon={<FiBook />} />
          <StatItem value="98" suffix="%" label={t.stats?.satisfactionLabel} icon={<FiAward />} />
          <div className="stat-ribbon__item">
            <div className="stat-ribbon__icon"><FiClock /></div>
            <span className="stat-ribbon__number">{t.stats?.support}</span>
            <span className="stat-ribbon__label">{t.stats?.supportLabel}</span>
          </div>
        </div>
      </section>

      {/* ═══════ FEATURES ═══════ */}
      <motion.section className="features-section" id="features" initial="hidden" whileInView="visible" viewport={{ once: false, amount: 0.2 }} variants={staggerContainer}>
        <div className="section-container">
          <motion.h2 className="section-title" variants={fadeInUp}>Built for <span className="highlight">Everyone</span></motion.h2>
          <motion.p className="section-subtitle" variants={fadeInUp}>Powerful tools designed for every role in your institution</motion.p>
          <div className="features">
            {/* Students Card */}
            <motion.div className="feature-card feature-card--student" variants={fadeInUp}>
              <div className="feature-card__accent" />
              <div className="feature-card__body">
                <div className="feature-card__icon-wrap feature-card__icon-wrap--student"><FaUserGraduate /></div>
                <div className="feature-card__tag">For Students</div>
                <h3 className="feature-card__title">{t.features?.students}</h3>
                <p className="feature-card__desc">{t.features?.studentsDesc}</p>
                <ul className="feature-card__list">
                  <li><FiCheckCircle /> Access assignments &amp; lab tasks</li>
                  <li><FiCheckCircle /> Track grades &amp; progress</li>
                  <li><FiCheckCircle /> Download course handouts</li>
                </ul>
                <Link to="/signup" className="feature-card__cta">Get Started <FiArrowRight /></Link>
              </div>
            </motion.div>

            {/* Teachers Card */}
            <motion.div className="feature-card feature-card--teacher" variants={fadeInUp}>
              <div className="feature-card__accent feature-card__accent--teacher" />
              <div className="feature-card__body">
                <div className="feature-card__icon-wrap feature-card__icon-wrap--teacher"><FaChalkboardTeacher /></div>
                <div className="feature-card__tag">For Teachers</div>
                <h3 className="feature-card__title">{t.features?.teachers}</h3>
                <p className="feature-card__desc">{t.features?.teachersDesc}</p>
                <ul className="feature-card__list">
                  <li><FiCheckCircle /> Create modules &amp; tasks</li>
                  <li><FiCheckCircle /> Grade student submissions</li>
                  <li><FiCheckCircle /> Upload handouts &amp; resources</li>
                </ul>
                <Link to="/signup" className="feature-card__cta feature-card__cta--teacher">Start Teaching <FiArrowRight /></Link>
              </div>
            </motion.div>

            {/* Admins Card */}
            <motion.div className="feature-card feature-card--admin" variants={fadeInUp}>
              <div className="feature-card__accent feature-card__accent--admin" />
              <div className="feature-card__body">
                <div className="feature-card__icon-wrap feature-card__icon-wrap--admin"><FaUserTie /></div>
                <div className="feature-card__tag">For Admins</div>
                <h3 className="feature-card__title">{t.features?.admins}</h3>
                <p className="feature-card__desc">{t.features?.adminsDesc}</p>
                <ul className="feature-card__list">
                  <li><FiCheckCircle /> Manage users &amp; roles</li>
                  <li><FiCheckCircle /> Monitor system activity</li>
                  <li><FiCheckCircle /> Generate reports</li>
                </ul>
                <Link to="/signup" className="feature-card__cta feature-card__cta--admin">Manage System <FiArrowRight /></Link>
              </div>
            </motion.div>
          </div>
        </div>
      </motion.section>

      {/* ═══════ HOW IT WORKS ═══════ */}
      <motion.section className="hiw-section" id="how-it-works" initial="hidden" whileInView="visible" viewport={{ once: false, amount: 0.3 }} variants={staggerContainer}>
        <div className="section-container">
          <motion.h2 className="section-title" variants={fadeInUp}>{t.howItWorks?.title} <span className="highlight">{t.howItWorks?.titleHighlight}</span></motion.h2>
          <motion.p className="section-subtitle" variants={fadeInUp}>{t.howItWorks?.subtitle}</motion.p>
          <div className="hiw-timeline">
            {t.howItWorks?.steps?.map((step, i) => (
              <motion.div className="hiw-step" key={i} variants={fadeInUp}>
                <div className="hiw-step__number">{step.number}</div>
                <div className="hiw-step__connector" />
                <h3 className="hiw-step__title">{step.title}</h3>
                <p className="hiw-step__desc">{step.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.section>

      {/* ═══════ TESTIMONIALS ═══════ */}
      <motion.section className="testimonials-section" id="testimonials" initial="hidden" whileInView="visible" viewport={{ once: false, amount: 0.3 }} variants={staggerContainer}>
        <div className="section-container">
          <motion.h2 className="section-title" variants={fadeInUp}>{t.testimonials?.title} <span className="highlight">{t.testimonials?.titleHighlight}</span></motion.h2>
          <motion.p className="section-subtitle" variants={fadeInUp}>{t.testimonials?.subtitle}</motion.p>
          <div className="testimonials-grid">
            {t.testimonials?.items?.map((item, i) => (
              <motion.div className="testimonial-card" key={i} variants={fadeInUp}>
                <FaQuoteLeft className="testimonial-card__quote-icon" />
                <p className="testimonial-card__text">{item.quote}</p>
                <div className="testimonial-card__author">
                  <div className="testimonial-card__avatar">{item.name.charAt(0)}</div>
                  <div>
                    <div className="testimonial-card__name">{item.name}</div>
                    <div className="testimonial-card__role">{item.role}</div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.section>

      {/* ═══════ FAQ ═══════ */}
      <motion.section className="faq-section" initial="hidden" whileInView="visible" viewport={{ once: false, amount: 0.3 }} variants={staggerContainer}>
        <div className="section-container">
          <motion.h2 className="section-title" variants={fadeInUp}>{t.faq?.title} <span className="highlight">{t.faq?.titleHighlight}</span></motion.h2>
          <motion.p className="section-subtitle" variants={fadeInUp}>{t.faq?.subtitle}</motion.p>
          <div className="faq-container">
            {t.faq?.items?.map((faq, index) => (
              <motion.div key={index} className={`faq-item ${activeIndex === index ? 'active' : ''}`} variants={fadeInUp}>
                <button className="faq-question" onClick={() => toggleFAQ(index)}>
                  {faq.question}
                  <span className="faq-icon">{activeIndex === index ? <FiMinus /> : <FiPlus />}</span>
                </button>
                <div className="faq-answer" style={{ maxHeight: activeIndex === index ? '200px' : '0', paddingBottom: activeIndex === index ? '1.5rem' : '0' }}>
                  <p>{faq.answer}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.section>

      {/* ═══════ CONTACT ═══════ */}
      <motion.section className="contact-section" id="contact" initial="hidden" whileInView="visible" viewport={{ once: false, amount: 0.3 }} variants={staggerContainer}>
        <div className="section-container">
          <motion.h2 className="section-title" variants={fadeInUp}>{t.contact?.title} <span className="highlight">{t.contact?.titleHighlight}</span></motion.h2>
          <motion.p className="section-subtitle" variants={fadeInUp}>{t.contact?.subtitle}</motion.p>
          <div className="contact-container">
            <motion.div className="contact-info" variants={fadeInUp}>
              <div className="contact-item"><div className="contact-icon"><FiMapPin /></div><div><h3>{t.contact?.address}</h3><p>{t.contact?.addressValue}</p></div></div>
              <div className="contact-item"><div className="contact-icon"><FiPhone /></div><div><h3>{t.contact?.phone}</h3><p>{t.contact?.phoneValue}</p></div></div>
              <div className="contact-item"><div className="contact-icon"><FiMail /></div><div><h3>{t.contact?.email}</h3><p>{t.contact?.emailValue}</p></div></div>
            </motion.div>
            <motion.form className="contact-form" onSubmit={(e) => e.preventDefault()} variants={fadeInUp}>
              <div className="form-group"><input type="text" placeholder={t.contact?.namePlaceholder} required /></div>
              <div className="form-group"><input type="email" placeholder={t.contact?.emailPlaceholder} required /></div>
              <div className="form-group"><input type="text" placeholder="Subject" required /></div>
              <div className="form-group"><textarea placeholder={t.contact?.messagePlaceholder} required></textarea></div>
              <button type="submit" className="btn btn-primary btn-full">{t.contact?.sendButton} <FiSend style={{ marginLeft: '0.5rem' }} /></button>
            </motion.form>
          </div>
        </div>
      </motion.section>

      {/* ═══════ FOOTER ═══════ */}
      <footer className="footer">
        <div className="footer__inner">
          <div className="footer__brand">
            <h2 className="footer__logo">SamVidyaa</h2>
            <p className="footer__tagline">{t.footer?.tagline}</p>
            <div className="footer__socials">
              <a href="#" aria-label="GitHub"><FaGithub /></a>
              <a href="#" aria-label="Twitter"><FaTwitter /></a>
              <a href="#" aria-label="LinkedIn"><FaLinkedin /></a>
            </div>
          </div>
          <div className="footer__col">
            <h4>{t.footer?.product}</h4>
            <ul>{t.footer?.productLinks?.map((l, i) => <li key={i}><a href="#">{l}</a></li>)}</ul>
          </div>
          <div className="footer__col">
            <h4>{t.footer?.company}</h4>
            <ul>{t.footer?.companyLinks?.map((l, i) => <li key={i}><a href="#">{l}</a></li>)}</ul>
          </div>
          <div className="footer__col">
            <h4>{t.footer?.support}</h4>
            <ul>{t.footer?.supportLinks?.map((l, i) => <li key={i}><a href="#">{l}</a></li>)}</ul>
          </div>
        </div>
        <div className="footer__bottom">
          <p>{t.footer?.copyright}</p>
        </div>
      </footer>
    </div>
  )
}

export default LandingPage
