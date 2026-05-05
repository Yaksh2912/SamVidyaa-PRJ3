import React from 'react'
import './Skeleton.css'

const createItems = (count) => Array.from({ length: count }, (_, index) => index)

const joinClasses = (...classes) => classes.filter(Boolean).join(' ')

export function useDelayedLoading(loading, delayMs = 140) {
  const [visible, setVisible] = React.useState(false)

  React.useEffect(() => {
    if (!loading) {
      setVisible(false)
      return undefined
    }

    const timeoutId = window.setTimeout(() => {
      setVisible(true)
    }, delayMs)

    return () => window.clearTimeout(timeoutId)
  }, [delayMs, loading])

  return visible
}

function SkeletonLine({ className = '', width = '100%', height = '0.85rem', style }) {
  return (
    <div
      className={joinClasses('skeleton-line', className)}
      style={{ width, height, ...style }}
      aria-hidden="true"
    />
  )
}

function SkeletonGroup({ className = '', visible = true, children }) {
  return (
    <div className={joinClasses('skeleton-group', visible && 'is-visible', className)} aria-hidden="true">
      {children}
    </div>
  )
}

export function AppShellSkeleton({ label, visible = true }) {
  return (
    <div className="loading-screen loading-screen--skeleton">
      <SkeletonGroup className="loading-screen__shell" visible={visible}>
        <div className="loading-screen__panel">
          <div className="loading-screen__hero">
            <SkeletonLine width="10rem" height="1rem" />
            <SkeletonLine width="16rem" height="2.2rem" />
            <SkeletonLine width="12rem" />
          </div>
          <div className="loading-screen__grid">
            {createItems(3).map((item) => (
              <div key={item} className="loading-screen__card">
                <SkeletonLine width="45%" />
                <SkeletonLine width="72%" height="1.35rem" />
                <SkeletonLine width="58%" />
              </div>
            ))}
          </div>
        </div>
      </SkeletonGroup>
      {label ? <span className="loading-screen__label">{label}</span> : null}
    </div>
  )
}

export function CourseGridSkeleton({ count = 3, visible = true }) {
  return (
    <SkeletonGroup className="gc-course-grid" visible={visible}>
      {createItems(count).map((item) => (
        <div key={item} className="gc-course-card gc-course-card--skeleton">
          <div className="gc-card-header gc-card-header--skeleton">
            <SkeletonLine className="skeleton-line--light" width="68%" height="1.35rem" />
            <SkeletonLine className="skeleton-line--light skeleton-line--soft" width="48%" />
          </div>
          <div className="gc-card-avatar gc-card-avatar--skeleton">
            <div className="skeleton-orb" />
          </div>
          <div className="gc-card-body">
            <SkeletonLine width="92%" />
            <SkeletonLine width="84%" />
            <SkeletonLine width="64%" />
            <SkeletonLine width="36%" height="0.78rem" style={{ marginTop: '0.9rem' }} />
          </div>
          <div className="gc-card-footer">
            <SkeletonLine className="skeleton-line--circle" width="2.4rem" height="2.4rem" />
          </div>
        </div>
      ))}
    </SkeletonGroup>
  )
}

export function RewardGridSkeleton({ count = 3, visible = true }) {
  return (
    <SkeletonGroup className="rewards-grid skeleton-card-grid" visible={visible}>
      {createItems(count).map((item) => (
        <div key={item} className="reward-card reward-card--skeleton">
          <div className="reward-card-icon reward-card-icon--skeleton">
            <div className="skeleton-orb" />
          </div>
          <div className="reward-card-body">
            <SkeletonLine width="56%" height="1.1rem" />
            <SkeletonLine width="40%" height="0.78rem" style={{ marginTop: '0.25rem' }} />
            <SkeletonLine width="94%" />
            <SkeletonLine width="72%" />
          </div>
          <div className="reward-card-footer">
            <SkeletonLine width="4.8rem" />
            <SkeletonLine width="6.2rem" height="2.2rem" style={{ borderRadius: '999px' }} />
          </div>
        </div>
      ))}
    </SkeletonGroup>
  )
}

export function LeaderboardSkeleton({ count = 5, visible = true }) {
  return (
    <SkeletonGroup className="ranking-list" visible={visible}>
      {createItems(count).map((item) => (
        <div key={item} className="ranking-item ranking-item--skeleton">
          <SkeletonLine className="skeleton-line--circle" width="2.125rem" height="2.125rem" />
          <SkeletonLine className="skeleton-line--circle" width="2.5rem" height="2.5rem" />
          <div className="ranking-item__content">
            <SkeletonLine width="11rem" />
            <SkeletonLine width="7rem" height="0.75rem" />
          </div>
          <SkeletonLine width="4rem" height="1rem" />
        </div>
      ))}
    </SkeletonGroup>
  )
}

export function StudentHistorySkeleton({ count = 3, visible = true }) {
  return (
    <SkeletonGroup className="student-history-list" visible={visible}>
      {createItems(count).map((item) => (
        <article key={item} className="student-history-item student-history-item--skeleton">
          <div className="student-history-item__top">
            <div className="student-history-item__copy">
              <SkeletonLine width="13rem" height="1.1rem" />
              <SkeletonLine width="10rem" />
            </div>
            <SkeletonLine width="5.75rem" height="2.1rem" style={{ borderRadius: '999px' }} />
          </div>
          <div className="student-history-chip-row">
            <SkeletonLine width="5.25rem" height="1.85rem" style={{ borderRadius: '999px' }} />
            <SkeletonLine width="6rem" height="1.85rem" style={{ borderRadius: '999px' }} />
            <SkeletonLine width="4.5rem" height="1.85rem" style={{ borderRadius: '999px' }} />
          </div>
          <div className="student-history-item__footer student-history-item__footer--skeleton">
            <SkeletonLine width="8rem" height="0.8rem" />
            <SkeletonLine width="10rem" height="0.8rem" />
          </div>
        </article>
      ))}
    </SkeletonGroup>
  )
}

export function TeacherModuleGridSkeleton({ count = 3, visible = true }) {
  return (
    <SkeletonGroup className="teacher-module-grid" visible={visible}>
      {createItems(count).map((item) => (
        <div key={item} className="teacher-module-card teacher-module-card--skeleton">
          <div className="teacher-module-card-body">
            <div className="teacher-module-top">
              <div className="teacher-module-heading">
                <SkeletonLine width="5rem" height="0.72rem" />
                <SkeletonLine width="10rem" height="1.15rem" style={{ marginTop: '0.45rem' }} />
              </div>
              <div className="teacher-module-header-actions teacher-module-header-actions--skeleton">
                {createItems(3).map((action) => (
                  <SkeletonLine key={action} className="skeleton-line--circle" width="2.2rem" height="2.2rem" />
                ))}
              </div>
            </div>
            <SkeletonLine width="96%" />
            <SkeletonLine width="72%" />
            <div className="teacher-module-stat-grid">
              {createItems(3).map((stat) => (
                <div key={stat} className="teacher-module-stat-card teacher-module-stat-card--skeleton">
                  <SkeletonLine className="skeleton-line--circle" width="2.2rem" height="2.2rem" />
                  <div className="teacher-module-stat-copy">
                    <SkeletonLine width="2.4rem" />
                    <SkeletonLine width="3.5rem" height="0.7rem" />
                  </div>
                </div>
              ))}
            </div>
            <div className="teacher-module-primary-actions teacher-module-primary-actions--skeleton">
              <SkeletonLine width="7.5rem" height="2.5rem" style={{ borderRadius: '999px' }} />
              <SkeletonLine width="6.75rem" height="2.5rem" style={{ borderRadius: '999px' }} />
            </div>
          </div>
        </div>
      ))}
    </SkeletonGroup>
  )
}

export function TeacherTaskGridSkeleton({ count = 3, visible = true }) {
  return (
    <SkeletonGroup className="teacher-task-grid" visible={visible}>
      {createItems(count).map((item) => (
        <div key={item} className="teacher-task-card teacher-task-card--skeleton">
          <div className="teacher-task-top">
            <div>
              <SkeletonLine width="11rem" height="1.1rem" />
              <SkeletonLine width="14rem" />
            </div>
            <SkeletonLine width="5rem" height="1.8rem" style={{ borderRadius: '999px' }} />
          </div>
          <div className="teacher-task-meta">
            {createItems(4).map((meta) => (
              <SkeletonLine key={meta} width="5.75rem" height="1.9rem" style={{ borderRadius: '999px' }} />
            ))}
          </div>
          <SkeletonLine width="96%" />
          <SkeletonLine width="72%" />
          <div className="teacher-task-actions teacher-task-actions--skeleton">
            <SkeletonLine width="6.25rem" height="2.4rem" style={{ borderRadius: '999px' }} />
            <SkeletonLine width="6.25rem" height="2.4rem" style={{ borderRadius: '999px' }} />
          </div>
        </div>
      ))}
    </SkeletonGroup>
  )
}

export function StudentListSkeleton({ count = 5, visible = true }) {
  return (
    <SkeletonGroup className="students-list" visible={visible}>
      {createItems(count).map((item) => (
        <div key={item} className="student-row student-row--skeleton">
          <div className="student-main">
            <SkeletonLine width="8rem" />
            <SkeletonLine width="11rem" />
            <SkeletonLine width="5rem" />
          </div>
          <div className="student-actions student-actions--skeleton">
            <SkeletonLine width="5rem" height="2.15rem" style={{ borderRadius: '999px' }} />
          </div>
        </div>
      ))}
    </SkeletonGroup>
  )
}

export function AnnouncementFeedSkeleton({ count = 3, visible = true, className = '' }) {
  return (
    <SkeletonGroup className={joinClasses(className, 'skeleton-feed')} visible={visible}>
      {createItems(count).map((item) => (
        <article key={item} className="dashboard-announcement-item dashboard-announcement-item--skeleton">
          <div className="dashboard-announcement-item__meta">
            <div>
              <SkeletonLine width="11rem" height="1rem" />
              <SkeletonLine width="8rem" height="0.75rem" />
            </div>
            <SkeletonLine width="5rem" height="2.1rem" style={{ borderRadius: '999px' }} />
          </div>
          <SkeletonLine width="96%" />
          <SkeletonLine width="82%" />
          <SkeletonLine width="68%" />
        </article>
      ))}
    </SkeletonGroup>
  )
}

export function PanelStatusSkeleton({ lines = 3, visible = true }) {
  return (
    <SkeletonGroup className="admin-installer-panel__status admin-installer-panel__status--stacked" visible={visible}>
      {createItems(lines).map((item) => (
        <SkeletonLine key={item} width={item === lines - 1 ? '5rem' : item === 0 ? '12rem' : '8rem'} />
      ))}
    </SkeletonGroup>
  )
}
