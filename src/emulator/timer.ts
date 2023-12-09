import { MutableValue } from "../types";
import { increment } from "./arithmetic";
import { setBit, testBit } from "./instructions/instructionHelpers";
import Memory from "./memory";
import { Interrupt } from "./memory/registers/interruptRegisters";
import { ByteRef } from "./refs/byteRef";
import { WordRef } from "./refs/wordRef";

const DIV_CYCLE_ROLLOVER = 256

export default class Timer {
  memory: Memory

  divider: ByteRef
  counter: ByteRef
  modulo: ByteRef
  control: ByteRef

  timerCycles = 0
  divCycles = 0

  constructor(memory: Memory) {
    this.memory = memory

    this.divider = this.memory.at(0xFF04)
    this.counter = this.memory.at(0xFF05)
    this.modulo = this.memory.at(0xFF06)
    this.control = this.memory.at(0xFF07)
  }

  updateClock(cycles: number): void {
    this.timerCycles += cycles
    this.divCycles += cycles

    if (this.divCycles > DIV_CYCLE_ROLLOVER) {
      this.divCycles -= DIV_CYCLE_ROLLOVER
      this.divider.value++
    }

    const timerRollover = this.getTimerRollover()
    if (this.timerCycles > timerRollover) {
      this.timerCycles -= timerRollover
      this.counter.value++
      if (this.counter.value === 0) {
        this.counter.value = this.modulo.value
        this.memory.registers.interrupts.setInterrupt(Interrupt.VBlank)
      }
    }


  }

  isEnabled(): boolean {
    return this.memory.registers.timerControl.enabled
  }

  getTimerRollover(): number {
    const mode = this.memory.registers.timerControl.clockSelect
    return [1024, 16, 64, 256][mode]
  }
}