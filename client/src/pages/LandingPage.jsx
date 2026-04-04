import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { FiPlus, FiMinus, FiMapPin, FiPhone, FiMail, FiSend, FiSun, FiMoon, FiBookOpen, FiUsers, FiDownload, FiChevronLeft, FiChevronRight } from 'react-icons/fi'
import { HiStar } from 'react-icons/hi2'
import { useTheme } from '../context/ThemeContext'
import { useI18n } from '../context/I18nContext'
import API_BASE_URL from '../config'
import './LandingPage.css'

// faqData moved to translations

function useCountUp(target, duration = 1200) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (typeof target !== 'number' || target <= 0) {
      setCount(0);
      return;
    }

    let animationFrameId;
    let startTime;

    const animate = (timestamp) => {
      if (!startTime) {
        startTime = timestamp;
      }

      const progress = Math.min((timestamp - startTime) / duration, 1);
      const easedProgress = 1 - Math.pow(1 - progress, 3);
      const nextValue = Math.round(target * easedProgress);

      setCount(nextValue);

      if (progress < 1) {
        animationFrameId = window.requestAnimationFrame(animate);
      }
    };

    setCount(0);
    animationFrameId = window.requestAnimationFrame(animate);

    return () => {
      window.cancelAnimationFrame(animationFrameId);
    };
  }, [target, duration]);

  return count;
}

function LandingPage() {
  const [activeIndex, setActiveIndex] = useState(null);
  const [desktopApp, setDesktopApp] = useState(undefined);
  const [testimonials, setTestimonials] = useState([]);
  const [activeTestimonialIndex, setActiveTestimonialIndex] = useState(0);
  const [isTestimonialsAutoPaused, setIsTestimonialsAutoPaused] = useState(false);
  const [platformStats, setPlatformStats] = useState({
    totalCourses: null,
    totalUsers: null,
  });
  const testimonialAutoplayIntervalRef = React.useRef(null);
  const testimonialAutoResumeTimeoutRef = React.useRef(null);
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
  const numberFormatter = new Intl.NumberFormat(language === 'hi' ? 'hi-IN' : 'en-US');
  const animatedCourseCount = useCountUp(platformStats.totalCourses);
  const animatedUserCount = useCountUp(platformStats.totalUsers);
  const animatedDownloadCount = useCountUp(desktopApp?.download_count);

  useEffect(() => {
    let isMounted = true;

    const fetchPlatformStats = async () => {
      try {
        const [statsResponse, desktopAppResponse] = await Promise.all([
          fetch(`${API_BASE_URL}/api/users/public-stats`),
          fetch(`${API_BASE_URL}/api/desktop-app/latest`),
        ]);
        const testimonialsResponse = await fetch(`${API_BASE_URL}/api/testimonials`);

        if (!statsResponse.ok) {
          throw new Error('Failed to fetch public stats');
        }

        const statsData = await statsResponse.json();

        if (isMounted) {
          setPlatformStats({
            totalCourses: Number.isFinite(statsData.totalCourses) ? statsData.totalCourses : 0,
            totalUsers: Number.isFinite(statsData.totalUsers) ? statsData.totalUsers : 0,
          });
        }

        if (desktopAppResponse.ok) {
          const desktopAppData = await desktopAppResponse.json();
          if (isMounted) {
            setDesktopApp(desktopAppData.available === false ? null : desktopAppData);
          }
        }

        if (testimonialsResponse.ok) {
          const testimonialsData = await testimonialsResponse.json();
          if (isMounted) {
            setTestimonials(Array.isArray(testimonialsData) ? testimonialsData : []);
          }
        }
      } catch (error) {
        console.error('Failed to load landing page stats', error);
        if (isMounted) {
          setDesktopApp(null);
          setTestimonials([]);
        }
      }
    };

    fetchPlatformStats();

    return () => {
      isMounted = false;
    };
  }, []);

  const formatStatValue = (animatedValue, rawValue) => (
    typeof rawValue === 'number' ? numberFormatter.format(animatedValue) : t.common.loading
  );

  const formatFileSize = (size) => {
    if (!size) return '0 B';
    const units = ['B', 'KB', 'MB', 'GB'];
    let value = size;
    let unitIndex = 0;

    while (value >= 1024 && unitIndex < units.length - 1) {
      value /= 1024;
      unitIndex += 1;
    }

    return `${value.toFixed(value >= 10 || unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`;
  };

  const getUploadUrl = (filePath = '') => `${API_BASE_URL}/${filePath.replace(/\\/g, '/')}`;
  const desktopAppVersionLabel = desktopApp
    ? translate('landingDownload.version', { version: desktopApp.version || 'Latest' })
    : t.common.notAvailable;
  const desktopAppSizeLabel = desktopApp
    ? translate('landingDownload.size', { size: formatFileSize(desktopApp.file_size) })
    : t.landingDownload?.unavailable;
  const desktopAppDetailLabel = desktopApp
    ? `${desktopAppVersionLabel} · ${desktopAppSizeLabel}`
    : t.landingDownload?.unavailable;

  useEffect(() => {
    if (testimonials.length === 0) {
      setActiveTestimonialIndex(0);
      return;
    }

    setActiveTestimonialIndex((prev) => prev % testimonials.length);
  }, [testimonials]);

  const advanceTestimonials = React.useCallback((direction = 1) => {
    setActiveTestimonialIndex((prev) => {
      if (testimonials.length <= 1) return 0;
      return (prev + direction + testimonials.length) % testimonials.length;
    });
  }, [testimonials.length]);

  const pauseTestimonialsAutoplay = React.useCallback((resumeDelay = null) => {
    setIsTestimonialsAutoPaused(true);

    if (testimonialAutoResumeTimeoutRef.current) {
      window.clearTimeout(testimonialAutoResumeTimeoutRef.current);
      testimonialAutoResumeTimeoutRef.current = null;
    }

    if (typeof resumeDelay === 'number') {
      testimonialAutoResumeTimeoutRef.current = window.setTimeout(() => {
        setIsTestimonialsAutoPaused(false);
        testimonialAutoResumeTimeoutRef.current = null;
      }, resumeDelay);
    }
  }, []);

  const resumeTestimonialsAutoplay = React.useCallback(() => {
    if (testimonialAutoResumeTimeoutRef.current) {
      window.clearTimeout(testimonialAutoResumeTimeoutRef.current);
      testimonialAutoResumeTimeoutRef.current = null;
    }

    setIsTestimonialsAutoPaused(false);
  }, []);

  useEffect(() => () => {
    if (testimonialAutoplayIntervalRef.current) {
      window.clearInterval(testimonialAutoplayIntervalRef.current);
    }

    if (testimonialAutoResumeTimeoutRef.current) {
      window.clearTimeout(testimonialAutoResumeTimeoutRef.current);
    }
  }, []);

  useEffect(() => {
    if (testimonialAutoplayIntervalRef.current) {
      window.clearInterval(testimonialAutoplayIntervalRef.current);
      testimonialAutoplayIntervalRef.current = null;
    }

    if (testimonials.length <= 1 || isTestimonialsAutoPaused) return undefined;

    testimonialAutoplayIntervalRef.current = window.setInterval(() => {
      advanceTestimonials(1);
    }, 4200);

    return () => {
      if (testimonialAutoplayIntervalRef.current) {
        window.clearInterval(testimonialAutoplayIntervalRef.current);
        testimonialAutoplayIntervalRef.current = null;
      }
    };
  }, [advanceTestimonials, isTestimonialsAutoPaused, testimonials.length]);

  const handleManualTestimonialScroll = (direction) => {
    advanceTestimonials(direction);
    pauseTestimonialsAutoplay(7000);
  };

  const getTestimonialCardPosition = (index) => {
    if (testimonials.length <= 1) return 'active';
    if (index === activeTestimonialIndex) return 'active';

    if (testimonials.length === 2) {
      return index === (activeTestimonialIndex + 1) % testimonials.length ? 'next' : 'hidden-right';
    }

    const prevIndex = (activeTestimonialIndex - 1 + testimonials.length) % testimonials.length;
    const nextIndex = (activeTestimonialIndex + 1) % testimonials.length;

    if (index === prevIndex) return 'prev';
    if (index === nextIndex) return 'next';

    const forwardDistance = (index - activeTestimonialIndex + testimonials.length) % testimonials.length;
    const backwardDistance = (activeTestimonialIndex - index + testimonials.length) % testimonials.length;

    return backwardDistance < forwardDistance ? 'hidden-left' : 'hidden-right';
  };

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

      {/* Hero section */}
      <div className="hero-wrapper">
        <motion.main
          className="hero"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: false, amount: 0.3 }}
          variants={staggerContainer}
        >
          <div className="hero-shell">
            <div className="hero-copy">
              <motion.div className="hero-eyebrow" variants={fadeInUp}>
                {t.landingStats?.eyebrow}
              </motion.div>
              <motion.h1 className="hero-title" variants={fadeInUp}>
                <span className="hero-title__prefix">{t.hero?.title}</span>
                <span className="hero-title__brand">SamVidyaa</span>
              </motion.h1>
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
              <motion.div className="hero-pills" variants={fadeInUp}>
                <span className="hero-pill">{t.landingStats?.cards?.courses?.label}</span>
                <span className="hero-pill">{t.landingStats?.cards?.users?.label}</span>
                <span className="hero-pill">{t.landingDownload?.installerLabel}</span>
              </motion.div>
            </div>

            <motion.aside className="hero-showcase" variants={fadeInUp}>
              <div className="hero-showcase__panel">
                <div className="hero-showcase__chrome" aria-hidden="true">
                  <span />
                  <span />
                  <span />
                </div>

                <div className="hero-showcase__header">
                  <div className="hero-showcase__badge">
                    <FiDownload />
                    <span>{t.landingDownload?.badge}</span>
                  </div>
                  <div className={`hero-showcase__status ${desktopApp ? 'hero-showcase__status--live' : ''}`}>
                    {desktopApp ? t.landingDownload?.availableNow : t.common.notAvailable}
                  </div>
                </div>

                <div className="hero-showcase__body">
                  <h2 className="hero-showcase__title">{t.landingDownload?.title}</h2>
                  <p className="hero-showcase__description">{desktopAppDetailLabel}</p>
                </div>

                <div className="hero-showcase__metrics">
                  <div className="hero-showcase__metric">
                    <span className="hero-showcase__metric-label">{t.landingDownload?.downloadsLabel}</span>
                    <strong className="hero-showcase__metric-value">
                      {desktopApp === undefined ? t.common.loading : numberFormatter.format(animatedDownloadCount)}
                    </strong>
                  </div>

                  <div className="hero-showcase__metric">
                    <span className="hero-showcase__metric-label">{t.landingDownload?.installerLabel}</span>
                    <strong className="hero-showcase__metric-value">{desktopAppVersionLabel}</strong>
                  </div>
                </div>

                <div className="hero-showcase__actions">
                  {desktopApp ? (
                    <a href={`${API_BASE_URL}/api/desktop-app/download`} className="btn btn-primary hero-showcase__button">
                      <FiDownload /> {t.landingDownload?.cta}
                    </a>
                  ) : (
                    <button type="button" className="btn btn-secondary hero-showcase__button" disabled>
                      <FiDownload /> {t.landingDownload?.cta}
                    </button>
                  )}

                  <p className="hero-showcase__footnote">
                    {desktopApp ? desktopAppVersionLabel : t.landingDownload?.unavailable}
                  </p>
                </div>
              </div>
            </motion.aside>
          </div>

          <motion.div className="hero-stats-ribbon" variants={fadeInUp}>
            <div className="hero-stats-ribbon__item">
              <div className="hero-stats-ribbon__icon">
                <FiBookOpen />
              </div>
              <div className="hero-stats-ribbon__metric">
                <div className="hero-stats-ribbon__value">{formatStatValue(animatedCourseCount, platformStats.totalCourses)}</div>
                <div className="hero-stats-ribbon__label">{t.landingStats?.cards?.courses?.label}</div>
              </div>
            </div>

            <div className="hero-stats-ribbon__divider" aria-hidden="true" />

            <div className="hero-stats-ribbon__item">
              <div className="hero-stats-ribbon__icon hero-stats-ribbon__icon--users">
                <FiUsers />
              </div>
              <div className="hero-stats-ribbon__metric">
                <div className="hero-stats-ribbon__value">{formatStatValue(animatedUserCount, platformStats.totalUsers)}</div>
                <div className="hero-stats-ribbon__label">{t.landingStats?.cards?.users?.label}</div>
              </div>
            </div>

            <div className="hero-stats-ribbon__divider" aria-hidden="true" />

            <div className="hero-stats-ribbon__item">
              <div className="hero-stats-ribbon__icon hero-stats-ribbon__icon--downloads">
                <FiDownload />
              </div>
              <div className="hero-stats-ribbon__metric">
                <div className="hero-stats-ribbon__value">{desktopApp === undefined ? t.common.loading : numberFormatter.format(animatedDownloadCount)}</div>
                <div className="hero-stats-ribbon__label">{t.landingDownload?.downloadsLabel}</div>
              </div>
            </div>
          </motion.div>
        </motion.main>
      </div>

      {testimonials.length > 0 ? (
        <motion.section
          className="testimonials-section"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: false, amount: 0.3 }}
          variants={staggerContainer}
        >
          <div className="section-container testimonials-container">
            <motion.h2 className="section-title" variants={fadeInUp}>
              {t.landingTestimonials?.title} <span className="highlight">{t.landingTestimonials?.titleHighlight}</span>
            </motion.h2>
            <motion.p className="section-subtitle" variants={fadeInUp}>{t.landingTestimonials?.subtitle}</motion.p>

            <motion.div className="testimonials-carousel" variants={fadeInUp}>
              <button
                type="button"
                className="testimonials-carousel__button"
                disabled={testimonials.length < 2}
                onClick={() => handleManualTestimonialScroll(-1)}
                aria-label="Previous testimonials"
              >
                <FiChevronLeft />
              </button>

              <div
                className="testimonials-stage"
                onMouseEnter={() => pauseTestimonialsAutoplay()}
                onMouseLeave={resumeTestimonialsAutoplay}
                onTouchStart={() => pauseTestimonialsAutoplay()}
                onTouchEnd={() => pauseTestimonialsAutoplay(5000)}
                onFocusCapture={() => pauseTestimonialsAutoplay()}
                onBlurCapture={resumeTestimonialsAutoplay}
              >
                <div className="testimonials-track">
                  {testimonials.map((testimonial, index) => (
                    <article
                      key={testimonial._id}
                      className={`testimonial-card testimonial-card--${getTestimonialCardPosition(index)}`}
                      aria-hidden={index !== activeTestimonialIndex}
                    >
                      <div className="testimonial-card__avatar-wrap">
                        {testimonial.image_path ? (
                          <img
                            className="testimonial-card__avatar"
                            src={getUploadUrl(testimonial.image_path)}
                            alt={testimonial.name}
                          />
                        ) : (
                          <div className="testimonial-card__avatar testimonial-card__avatar--placeholder">
                            {testimonial.name?.charAt(0)?.toUpperCase() || 'I'}
                          </div>
                        )}
                      </div>
                      <div className="testimonial-card__meta">
                        <strong>{testimonial.name}</strong>
                        <span>{testimonial.role}</span>
                      </div>
                      <p className="testimonial-card__quote">{testimonial.quote}</p>
                      <div className="testimonial-card__rating" aria-label="5 star testimonial">
                        {Array.from({ length: 5 }).map((_, starIndex) => (
                          <HiStar key={starIndex} />
                        ))}
                      </div>
                    </article>
                  ))}
                </div>
              </div>

              <button
                type="button"
                className="testimonials-carousel__button"
                disabled={testimonials.length < 2}
                onClick={() => handleManualTestimonialScroll(1)}
                aria-label="Next testimonials"
              >
                <FiChevronRight />
              </button>
            </motion.div>
          </div>
        </motion.section>
      ) : null}

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
