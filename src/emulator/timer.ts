import { MutableValue } from "../types";
import { increment } from "./arithmetic";
import { setBit, testBit } from "./instructions/instructionHelpers";
import Memory from "./memory";

const DIV_CYCLE_ROLLOVER = 256

export default class Timer {
  memory: Memory

  divider: MutableValue<8>
  counter: MutableValue<8>
  modulo: MutableValue<8>
  control: MutableValue<8>

  timerCycles = 0
  divCycles = 0

  constructor(memory: Memory) {
    this.memory = memory

    this.divider = this.memory.atOldQQ(0xFF04)
    this.counter = this.memory.atOldQQ(0xFF05)
    this.modulo = this.memory.atOldQQ(0xFF06)
    this.control = this.memory.atOldQQ(0xFF07)
  }

  updateClock(cycles: number): void {
    this.timerCycles += cycles
    this.divCycles += cycles

    if (this.divCycles > DIV_CYCLE_ROLLOVER) {
      this.divCycles -= DIV_CYCLE_ROLLOVER
      increment(this.divider)
    }

    const timerRollover = this.getTimerRollover()
    if (this.timerCycles > timerRollover) {
      this.timerCycles -= timerRollover
      increment(this.counter)
      if (this.counter.read() === 0) {
        this.counter.write(this.modulo.read())
        setBit(this.memory.atOldQQ(0xFF0F), 2) // VBlank interrupt flag ON
      }
    }


  }

  isEnabled(): boolean {
    return testBit(this.control, 2) === 1
  }

  getTimerRollover(): number {
    const mode = this.control.read() & 3
    return [1024, 16, 64, 256][mode]
  }
}