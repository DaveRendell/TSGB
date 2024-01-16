import { Instruction } from "../instructions/instruction"

export const disableInterrupts: Instruction = {
  execute: (cpu) => {
    cpu.interruptsEnabled = false
  },
  cycles: 4,
  parameterBytes: 0,
  description: () => "DI",
}

export const enableInterrupts: Instruction = {
  execute: (cpu) => {
    cpu.interruptsEnabled = true
  },
  cycles: 4,
  parameterBytes: 0,
  description: () => "EI",
}

export const stop: Instruction = {
  execute: (cpu) => {
    cpu.isStopped = true
    // TODO what does this actually do?

    cpu.memory.at(0xff04).byte = 0
  },
  cycles: 4,
  parameterBytes: 0,
  description: () => "STOP",
}

export const scf: Instruction = {
  execute(cpu) {
    cpu.registers.F.operation = false
    cpu.registers.F.halfCarry = false
    cpu.registers.F.carry = true
  },
  cycles: 4,
  parameterBytes: 0,
  description: () => "SCF",
}

export const ccf: Instruction = {
  execute(cpu) {
    cpu.registers.F.operation = false
    cpu.registers.F.halfCarry = false
    cpu.registers.F.carry = !cpu.registers.F.carry
  },
  cycles: 4,
  parameterBytes: 0,
  description: () => "CCF",
}
