type ChannelStop = () => void

// Roughly equal to 4.2MHz clock speed / 256Hz 
const LENGTH_TIMER_TICK = 0x4000

/**
 * Sound channel feature that turns the channel off after a certain amount
 * of time has passed.
 */
export class LengthTimer {
  channelStop: ChannelStop

  clock = 0
  enabled = false
  timer = 0

  constructor(channelStop: ChannelStop) {
    this.channelStop = channelStop
  }

  update(cycles: number) {
    if (this.enabled) {
      this.clock += cycles
      if (this.clock > LENGTH_TIMER_TICK) {
        this.clock -= LENGTH_TIMER_TICK
        this.timer++
        if (this.timer >= 64) {
          this.channelStop()
        }
      }
    }
  }

  enable() { this.enabled = true }
  disable() { this.enabled = false }

  setTimer(length: number) {
    this.timer = length
  }

  resetClock() { this.clock = 0 }
}