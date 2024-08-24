import { EmulatorMode } from "../../emulator"
import { Instruction } from "../instructions/instruction"

export const disableInterrupts: Instruction = {
  execute: (cpu) => {
    cpu.interruptsEnabled = false
  },
  cycles: 4,
  parameterBytes: 0,
  description: () => "DI",
  length: 1,
}

export const enableInterrupts: Instruction = {
  execute: (cpu) => {
    cpu.interruptsEnabled = true
  },
  cycles: 4,
  parameterBytes: 0,
  description: () => "EI",
  length: 1,
}

export const stop: Instruction = {
  execute: (cpu) => {
    cpu.isStopped = true
    
    if (cpu.memory.registers.speedSwitch.switchArmed && cpu.mode === EmulatorMode.CGB) {
      console.log("CPU switching speed!")
      cpu.memory.registers.speedSwitch.doubleSpeed =
        !cpu.memory.registers.speedSwitch.doubleSpeed
    }

    cpu.memory.at(0xff04).byte = 0
  },
  cycles: 4,
  parameterBytes: 0,
  description: () => "STOP",
  length: 1,
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
  length: 1,
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
  length: 1,
}
