import { Instruction } from "../instruction";

export const disableInterrupts: Instruction = {
  execute: (cpu) => { cpu.interruptsEnabled = false },
  cycles: 4,
  parameterBytes: 0,
  description: () => "DI"
}

export const enableInterrupts: Instruction = {
  execute: (cpu) => { cpu.interruptsEnabled = true },
  cycles: 4,
  parameterBytes: 0,
  description: () => "EI"
}

export const stop: Instruction = {
  execute: (cpu) => {
    cpu.isStopped = true
    // TODO what does this actually do?

    cpu.memory.at(0xFF04).write(0)
  },
  cycles: 4,
  parameterBytes: 0,
  description: () => "STOP"
}