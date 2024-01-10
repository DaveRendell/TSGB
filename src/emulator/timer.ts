import Memory from "./memory/memoryMap"
import {
  Interrupt,
  InterruptRegister,
} from "./memory/registers/interruptRegisters"
import {
  DividerRegister,
  TimerControlRegister,
} from "./memory/registers/timerRegisters"
import { ByteRef } from "./refs/byteRef"

const DIV_CYCLE_ROLLOVER = 256

export default class Timer {
  divider: DividerRegister
  counter: ByteRef
  modulo: ByteRef
  control: TimerControlRegister

  interrupts: InterruptRegister

  timerCycles = 0
  divCycles = 0

  constructor(memory: Memory) {
    this.divider = memory.registers.divider
    this.counter = memory.registers.timerCounter
    this.modulo = memory.registers.timerModulo
    this.control = memory.registers.timerControl

    this.interrupts = memory.registers.interrupts
  }

  updateClock(cycles: number): void {
    this.timerCycles += cycles
    this.divCycles += cycles

    if (this.divCycles > DIV_CYCLE_ROLLOVER) {
      this.divCycles -= DIV_CYCLE_ROLLOVER
      this.divider.increment()
    }

    const timerRollover = this.getTimerRollover()
    if (this.timerCycles > timerRollover) {
      this.timerCycles -= timerRollover
      this.counter.value++
      if (this.counter.value === 0) {
        this.counter.value = this.modulo.value
        this.interrupts.setInterrupt(Interrupt.Timer)
      }
    }
  }

  getTimerRollover(): number {
    const mode = this.control.clockSelect
    return [1024, 16, 64, 256][mode]
  }
}
