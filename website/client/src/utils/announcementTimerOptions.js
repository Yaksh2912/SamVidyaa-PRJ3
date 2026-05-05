export const ANNOUNCEMENT_TIMER_PRESETS = [
  { value: 'none', minutes: null, labelKey: 'timerKeepOption' },
  { value: '30m', minutes: 30, labelKey: 'timer30MinutesOption' },
  { value: '1h', minutes: 60, labelKey: 'timer1HourOption' },
  { value: '3h', minutes: 180, labelKey: 'timer3HoursOption' },
  { value: '1d', minutes: 1440, labelKey: 'timer1DayOption' },
  { value: '3d', minutes: 4320, labelKey: 'timer3DaysOption' },
  { value: '7d', minutes: 10080, labelKey: 'timer7DaysOption' },
  { value: 'custom', minutes: null, labelKey: 'timerCustomOption' },
]

export const ANNOUNCEMENT_TIMER_UNITS = [
  { value: 'minutes', multiplier: 1, labelKey: 'timerUnitMinutes' },
  { value: 'hours', multiplier: 60, labelKey: 'timerUnitHours' },
  { value: 'days', multiplier: 1440, labelKey: 'timerUnitDays' },
]

export const getDefaultAnnouncementTimerForm = () => ({
  timerPreset: 'none',
  customTimerValue: '',
  customTimerUnit: 'hours',
})

export const getAnnouncementExpiryMinutes = (timerForm) => {
  const selectedPreset = ANNOUNCEMENT_TIMER_PRESETS.find((preset) => preset.value === timerForm?.timerPreset)

  if (!selectedPreset || selectedPreset.value === 'none') {
    return null
  }

  if (selectedPreset.value !== 'custom') {
    return selectedPreset.minutes
  }

  const selectedUnit = ANNOUNCEMENT_TIMER_UNITS.find((unit) => unit.value === timerForm?.customTimerUnit)
  const customValue = Number(timerForm?.customTimerValue)

  if (!selectedUnit || !Number.isInteger(customValue) || customValue < 1) {
    return null
  }

  return customValue * selectedUnit.multiplier
}

export const isAnnouncementTimerValid = (timerForm) => {
  if (timerForm?.timerPreset !== 'custom') {
    return true
  }

  const expiryMinutes = getAnnouncementExpiryMinutes(timerForm)
  return Number.isInteger(expiryMinutes) && expiryMinutes >= 1 && expiryMinutes <= 10080
}
