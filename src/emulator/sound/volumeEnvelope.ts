type VolumeIncrementer = (increment: number) => void

// Roughly equal to 4.2MHz clock speed / 64Hz
const ENVELOPER_TIMER_TICK = 0x10000

/**
 * Sound channel feature which regularly changes the volume of the channel
 * until it reaches a maximum or minimum value.
 */
export class VolumeEnvelope {
  clock: number = 0
  direction: 1 | -1 = 1
  pace: number = 0
  timer: number = 0
  volumeIncrement: VolumeIncrementer

  constructor(volumeSetter: VolumeIncrementer) {
    this.volumeIncrement = volumeSetter
  }

  update(cycles: number) {
    if (this.pace) {
      this.clock += cycles
      if (this.clock > ENVELOPER_TIMER_TICK) {
        this.clock -= ENVELOPER_TIMER_TICK
        this.timer--
        if (this.timer <= 0) {
          this.timer = this.pace
          this.volumeIncrement(this.direction)
        }
      }
    }
  }

  setEnvelope(direction: 1 | -1, pace: number) {
    this.direction = direction
    this.pace = pace
    this.timer = pace
  }

  resetClock() { this.clock = 0 }
}