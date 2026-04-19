import API_BASE_URL from '../config'

const parseAnnouncementDate = (value) => {
  if (!value) return null

  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime()) ? null : parsed
}

export const isAnnouncementActive = (announcement, now = Date.now()) => {
  const expiresAt = parseAnnouncementDate(announcement?.expires_at)
  return !expiresAt || expiresAt.getTime() > now
}

export const normalizeAnnouncementList = (announcements) => (
  Array.isArray(announcements)
    ? announcements
      .filter((announcement) => announcement && isAnnouncementActive(announcement))
      .sort((left, right) => new Date(right?.createdAt || 0).getTime() - new Date(left?.createdAt || 0).getTime())
    : []
)

const parseSseEvent = (rawEvent) => {
  const lines = rawEvent.split('\n')
  let eventName = 'message'
  const dataLines = []

  lines.forEach((line) => {
    if (!line || line.startsWith(':')) return

    if (line.startsWith('event:')) {
      eventName = line.slice(6).trim() || 'message'
      return
    }

    if (line.startsWith('data:')) {
      dataLines.push(line.slice(5).trim())
    }
  })

  if (!dataLines.length) {
    return null
  }

  const rawData = dataLines.join('\n')

  try {
    return {
      event: eventName,
      data: JSON.parse(rawData),
    }
  } catch (_error) {
    return {
      event: eventName,
      data: rawData,
    }
  }
}

export const subscribeToAnnouncementStream = ({ token, onEvent, onError, reconnectDelayMs = 3000 }) => {
  if (!token) {
    return () => {}
  }

  let active = true
  let buffer = ''
  let reconnectTimer = null
  let controller = null

  const scheduleReconnect = () => {
    if (!active) return

    reconnectTimer = window.setTimeout(() => {
      connect()
    }, reconnectDelayMs)
  }

  const flushBuffer = () => {
    buffer = buffer.replace(/\r/g, '')

    let separatorIndex = buffer.indexOf('\n\n')
    while (separatorIndex >= 0) {
      const rawEvent = buffer.slice(0, separatorIndex)
      buffer = buffer.slice(separatorIndex + 2)

      const parsedEvent = parseSseEvent(rawEvent)
      if (parsedEvent) {
        onEvent?.(parsedEvent)
      }

      separatorIndex = buffer.indexOf('\n\n')
    }
  }

  const connect = async () => {
    controller = new AbortController()

    try {
      const response = await fetch(`${API_BASE_URL}/api/announcements/stream`, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'text/event-stream',
        },
        cache: 'no-store',
        signal: controller.signal,
      })

      if (!response.ok || !response.body) {
        throw new Error(`announcement_stream_${response.status}`)
      }

      const reader = response.body.getReader()
      const decoder = new TextDecoder()

      while (active) {
        const { value, done } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        flushBuffer()
      }
    } catch (error) {
      if (active && error.name !== 'AbortError') {
        onError?.(error)
      }
    } finally {
      if (active) {
        scheduleReconnect()
      }
    }
  }

  connect()

  return () => {
    active = false
    buffer = ''
    if (reconnectTimer) window.clearTimeout(reconnectTimer)
    controller?.abort()
  }
}
