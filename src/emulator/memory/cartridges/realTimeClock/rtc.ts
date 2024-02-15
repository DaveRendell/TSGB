export interface Rtc {
  seconds: number
  minutes: number
  hours: number
  days: number
  halt: boolean
  carry: boolean
  savedAt: Date
}

export function updateRtc(rtc: Rtc): Rtc {
  const now = new Date()
  let elapsedMs = now.getTime() - rtc.savedAt.getTime()

  const baseMs = 1000 * (
    rtc.seconds
    + 60 * (
      rtc.minutes
      + 60 * (
        rtc.hours
        + 24 * rtc.days
      )
    )
  )

  const newMs = baseMs + elapsedMs

  const epochDate = new Date(newMs)
  let days = Math.floor(newMs / (1000 * 60 * 60 * 24))
  let newCarry = false
  if (days > 0x1FF) {
    days /= 0x200
    newCarry = true
  }

  return {
    seconds: epochDate.getSeconds(),
    minutes: epochDate.getMinutes(),
    hours: epochDate.getHours() - 1,
    days,
    halt: rtc.halt,
    carry: rtc.carry || newCarry,
    savedAt: now
  }
}
