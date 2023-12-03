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