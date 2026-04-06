import React from 'react'

const clampPercent = (value) => Math.max(0, Math.min(100, Math.round(value || 0)))

const polarToCartesian = (centerX, centerY, radius, angleInDegrees) => {
  const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180.0

  return {
    x: centerX + (radius * Math.cos(angleInRadians)),
    y: centerY + (radius * Math.sin(angleInRadians))
  }
}

const describeArc = (x, y, radius, startAngle, endAngle) => {
  const start = polarToCartesian(x, y, radius, endAngle)
  const end = polarToCartesian(x, y, radius, startAngle)
  const largeArcFlag = endAngle - startAngle <= 180 ? '0' : '1'

  return [
    'M', start.x, start.y,
    'A', radius, radius, 0, largeArcFlag, 0, end.x, end.y
  ].join(' ')
}

export function AnalyticsDonutChart({ title, totalLabel, totalValue, items = [], emptyLabel }) {
  const nonZeroItems = items.filter((item) => item.value > 0)
  const normalizedItems = nonZeroItems.length ? nonZeroItems : items
  const total = normalizedItems.reduce((sum, item) => sum + item.value, 0)

  let currentAngle = 0
  const segments = normalizedItems.map((item) => {
    const ratio = total ? item.value / total : 0
    const angle = ratio * 360
    const segment = {
      ...item,
      startAngle: currentAngle,
      endAngle: currentAngle + angle
    }
    currentAngle += angle
    return segment
  })

  return (
    <section className="analytics-chart-card">
      <div className="analytics-chart-card__header">
        <h3>{title}</h3>
      </div>

      {!items.length || !total ? (
        <p className="empty-state">{emptyLabel}</p>
      ) : (
        <div className="analytics-donut-layout">
          <div className="analytics-donut-shell">
            <svg viewBox="0 0 120 120" className="analytics-donut-svg" aria-hidden="true">
              <circle cx="60" cy="60" r="42" className="analytics-donut-track" />
              {segments.map((segment) => (
                <path
                  key={segment.key}
                  d={describeArc(60, 60, 42, segment.startAngle, segment.endAngle || 0.01)}
                  className="analytics-donut-segment"
                  style={{ stroke: segment.color }}
                />
              ))}
            </svg>

            <div className="analytics-donut-center">
              <strong>{totalValue}</strong>
              <span>{totalLabel}</span>
            </div>
          </div>

          <div className="analytics-legend">
            {items.map((item) => {
              const percent = total ? clampPercent((item.value / total) * 100) : 0

              return (
                <div key={item.key} className="analytics-legend__item">
                  <span className="analytics-legend__swatch" style={{ background: item.color }} />
                  <div className="analytics-legend__copy">
                    <strong>{item.label}</strong>
                    <p>{item.value} • {percent}%</p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </section>
  )
}

export function AnalyticsColumnChart({ title, items = [], emptyLabel, valueFormatter = (value) => `${value}%` }) {
  const maxValue = Math.max(...items.map((item) => item.value), 0)

  return (
    <section className="analytics-chart-card">
      <div className="analytics-chart-card__header">
        <h3>{title}</h3>
      </div>

      {!items.length || !maxValue ? (
        <p className="empty-state">{emptyLabel}</p>
      ) : (
        <div className="analytics-columns">
          {items.map((item) => {
            const height = maxValue ? Math.max(12, Math.round((item.value / maxValue) * 100)) : 0

            return (
              <div key={item.key} className="analytics-columns__item">
                <span className="analytics-columns__value">{valueFormatter(item.value)}</span>
                <div className="analytics-columns__bar-wrap">
                  <div
                    className="analytics-columns__bar"
                    style={{ height: `${height}%`, background: item.color }}
                  />
                </div>
                <strong title={item.label}>{item.shortLabel || item.label}</strong>
                {item.meta && <p>{item.meta}</p>}
              </div>
            )
          })}
        </div>
      )}
    </section>
  )
}

export function AnalyticsHeatGrid({ title, items = [], emptyLabel }) {
  return (
    <section className="analytics-chart-card">
      <div className="analytics-chart-card__header">
        <h3>{title}</h3>
      </div>

      {!items.length ? (
        <p className="empty-state">{emptyLabel}</p>
      ) : (
        <div className="analytics-heat-grid">
          {items.map((item) => (
            <article
              key={item.key}
              className={`analytics-heat-card analytics-heat-card--${item.level || 'stable'}`}
              style={{ '--heat-strength': `${Math.max(18, Math.min(92, item.intensity || 0))}%` }}
            >
              <div className="analytics-heat-card__top">
                <div>
                  <strong>{item.title}</strong>
                  {item.subtitle && <p>{item.subtitle}</p>}
                </div>
                <span>{item.valueLabel}</span>
              </div>

              {item.metrics?.length ? (
                <div className="analytics-heat-card__metrics">
                  {item.metrics.map((metric) => (
                    <span key={`${item.key}-${metric.label}`}>
                      {metric.label}: {metric.value}
                    </span>
                  ))}
                </div>
              ) : null}

              {item.footer && <div className="analytics-heat-card__footer">{item.footer}</div>}
            </article>
          ))}
        </div>
      )}
    </section>
  )
}
