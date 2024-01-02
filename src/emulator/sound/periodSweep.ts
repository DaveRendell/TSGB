// Roughly equal to 4.2MHz clock speed / 128Hz
const SWEEP_TIMER_TICK = 0x5000

export class PeriodSweep {
  clock: number = 0
  pace: number = 0
  direction: 1 | -1 = 1
  step: number
  timer = 0
  incrementPeriod: (step: number, direction: 1 | -1) => void

  constructor(incrementPeriod: (step: number, direction: 1 | -1) => void) {
    this.incrementPeriod = incrementPeriod
  }

  update(cycles: number) {
    if (this.pace) {
      this.clock += cycles
      if (this.clock >= SWEEP_TIMER_TICK) {
        this.clock -= SWEEP_TIMER_TICK
        this.timer--
        if (this.timer <= 0) {
          this.timer = this.pace
          this.incrementPeriod(this.step, this.direction)
        }
      }
    }
  }

  setSweep(direction: 1 | -1, pace: number, step: number) {
    this.direction = direction
    this.pace = pace
    this.timer = pace
    this.step = step
  }

  resetClock() { this.clock = 0 }
}