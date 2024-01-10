import { addressDisplay } from "../../../helpers/displayHexNumbers"
import { JumpCondition } from "../../../types"
import { Instruction } from "./instruction"
import {
  WordLocation,
  combineBytes,
  describeWordLocation,
  getWordRef,
  splitBytes,
} from "./instructionHelpers"
import { CONDITIONS, CONDITION_NAMES } from "./jumps"

export const call: Instruction = {
  execute: (cpu) => {
    const sp = cpu.registers.SP
    const pc = cpu.registers.PC
    const address = cpu.nextWord.word

    const [h, l] = splitBytes(pc.word)

    cpu.memory.at(--sp.word).byte = h
    cpu.memory.at(--sp.word).byte = l

    pc.word = address
  },
  cycles: 24,
  parameterBytes: 2,
  description: ([l, h]) => `CALL ${addressDisplay(combineBytes(h, l))}`,
}

export function callF(condition: JumpCondition): Instruction {
  return {
    execute(cpu) {
      const address = cpu.nextWord.word
      if (CONDITIONS[condition](cpu)) {
        const sp = cpu.registers.SP
        const pc = cpu.registers.PC

        const [h, l] = splitBytes(pc.word)

        cpu.memory.at(--sp.word).byte = h
        cpu.memory.at(--sp.word).byte = l

        pc.word = address
      }
    },
    cycles: 24,
    parameterBytes: 2,
    description: ([l, h]) =>
      `CALL ${CONDITION_NAMES[condition]},${addressDisplay(
        combineBytes(h, l),
      )}`,
  }
}

export const ret: Instruction = {
  execute: (cpu) => {
    const sp = cpu.registers.SP
    const pc = cpu.registers.PC

    const l = cpu.memory.at(sp.word++).byte
    const h = cpu.memory.at(sp.word++).byte

    pc.word = combineBytes(h, l)
  },
  cycles: 16,
  parameterBytes: 0,
  description: () => "RET",
}

export const reti: Instruction = {
  execute(cpu) {
    const sp = cpu.registers.SP
    const pc = cpu.registers.PC

    const l = cpu.memory.at(sp.word++).byte
    const h = cpu.memory.at(sp.word++).byte

    pc.word = combineBytes(h, l)
    cpu.interruptsEnabled = true
  },
  cycles: 16,
  parameterBytes: 0,
  description: () => "RETI",
}

export function retF(condition: JumpCondition): Instruction {
  return {
    execute(cpu) {
      if (CONDITIONS[condition](cpu)) {
        const sp = cpu.registers.SP
        const pc = cpu.registers.PC

        const l = cpu.memory.at(sp.word++).byte
        const h = cpu.memory.at(sp.word++).byte

        pc.word = combineBytes(h, l)
      }
    },
    cycles: 20,
    parameterBytes: 0,
    description: () => `RET ${CONDITION_NAMES[condition]}`,
  }
}

export function push(registerName: WordLocation): Instruction {
  return {
    execute: (cpu) => {
      const sp = cpu.registers.SP
      const register = getWordRef(registerName, cpu)

      const [h, l] = splitBytes(register.word)

      cpu.memory.at(--sp.word).byte = h
      cpu.memory.at(--sp.word).byte = l
    },
    cycles: 16,
    parameterBytes: 0,
    description: () => `PUSH ${describeWordLocation(registerName)}`,
  }
}

export function pop(registerName: WordLocation): Instruction {
  return {
    execute: (cpu) => {
      const sp = cpu.registers.SP
      const register = getWordRef(registerName, cpu)

      const l = cpu.memory.at(sp.word++).byte
      const h = cpu.memory.at(sp.word++).byte

      register.word = combineBytes(h, l)
    },
    cycles: 12,
    parameterBytes: 0,
    description: () => `POP ${describeWordLocation(registerName)}`,
  }
}
