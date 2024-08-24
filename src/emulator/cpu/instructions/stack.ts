import { addressDisplay } from "../../../helpers/displayHexNumbers"
import { JumpCondition } from "../../../types"
import { Instruction } from "./instruction"
import {
  WordLocation,
  combineBytes,
  describePointerFromBytes,
  describeWordLocation,
  getWordRef,
  splitBytes,
} from "./instructionHelpers"
import { CONDITIONS, CONDITION_NAMES } from "./jumps"

export const call: Instruction = {
  execute: (cpu) => {
    const pc = cpu.registers.PC
    const address = cpu.nextWord.word

    cpu.pushCallToStack(pc.word)

    pc.word = address
  },
  cycles: 24,
  parameterBytes: 2,
  description: ([l, h]) => `CALL ${addressDisplay(combineBytes(h, l))}`,
  length: 3,
  toCode(bytes, emulator) {
    return `call ${describePointerFromBytes(bytes, emulator)}`
  }
}

export function callF(condition: JumpCondition): Instruction {
  return {
    execute(cpu) {
      const address = cpu.nextWord.word
      if (CONDITIONS[condition](cpu)) {
        const pc = cpu.registers.PC

        cpu.pushCallToStack(pc.word)

        pc.word = address
      }
    },
    cycles: 24,
    parameterBytes: 2,
    description: ([l, h]) =>
      `CALL ${CONDITION_NAMES[condition]},${addressDisplay(
        combineBytes(h, l),
      )}`,
    length: 3,
    toCode(bytes, emulator) {
      return `call ${CONDITION_NAMES[condition]},${describePointerFromBytes(bytes, emulator)}`
    }
  }
}

export const ret: Instruction = {
  execute: (cpu) => {
    const pc = cpu.registers.PC

    pc.word = cpu.popCallFromStack()
  },
  cycles: 16,
  parameterBytes: 0,
  description: () => "RET",
  length: 1,
  toCode() {
    return "ret"
  }
}

export const reti: Instruction = {
  execute(cpu) {
    const pc = cpu.registers.PC

    pc.word = cpu.popCallFromStack()
    cpu.interruptsEnabled = true
  },
  cycles: 16,
  parameterBytes: 0,
  description: () => "RETI",
  length: 1,
  toCode() {
    return "reti"
  }
}

export function retF(condition: JumpCondition): Instruction {
  return {
    execute(cpu) {
      if (CONDITIONS[condition](cpu)) {
        const pc = cpu.registers.PC

        pc.word = cpu.popCallFromStack()
      }
    },
    cycles: 20,
    parameterBytes: 0,
    description: () => `RET ${CONDITION_NAMES[condition]}`,
    length: 1,
    toCode() {
      return `ret ${CONDITION_NAMES[condition]}`
    }
  }
}

export function push(registerName: WordLocation): Instruction {
  return {
    execute: (cpu) => {
      const register = getWordRef(registerName, cpu)

      cpu.pushToStack(register.word)
    },
    cycles: 16,
    parameterBytes: 0,
    description: () => `PUSH ${describeWordLocation(registerName)([])}`,
    length: 1,
    toCode() {
      return `push ${describeWordLocation(registerName)([])}`
    }
  }
}

export function pop(registerName: WordLocation): Instruction {
  return {
    execute: (cpu) => {
      const register = getWordRef(registerName, cpu)

      register.word = cpu.popFromStack()
    },
    cycles: 12,
    parameterBytes: 0,
    description: () => `POP ${describeWordLocation(registerName)([])}`,
    length: 1,
    toCode() {
      return `pop ${describeWordLocation(registerName)([])}`
    }
  }
}
