import { addressDisplay } from "../../../helpers/displayHexNumbers"
import { JumpCondition } from "../../../types"
import CPU from "../cpu"
import { Instruction } from "./instruction"
import {
  combineBytes,
  from2sComplement,
  splitBytes,
} from "./instructionHelpers"

export const CONDITIONS: Record<JumpCondition, (cpu: CPU) => boolean> = {
  "Not-Zero": (cpu) => !cpu.registers.F.zero,
  Zero: (cpu) => cpu.registers.F.zero,
  "Not-Carry": (cpu) => !cpu.registers.F.carry,
  Carry: (cpu) => cpu.registers.F.carry,
  None: () => true,
}

export const CONDITION_NAMES: Record<JumpCondition, string> = {
  "Not-Zero": "NZ",
  Zero: "Z",
  "Not-Carry": "NC",
  Carry: "C",
  None: "",
}

export function jumpRelative(condition: JumpCondition): Instruction {
  return {
    execute: (cpu) => {
      const jump = from2sComplement(cpu.nextByte.byte)
      if (CONDITIONS[condition](cpu)) {
        cpu.registers.PC.word += jump
      }
    },
    cycles: 12,
    parameterBytes: 1,
    description: ([value]) =>
      `JR${CONDITION_NAMES[condition]} ${from2sComplement(value)}`,
  }
}

export function jump(condition: JumpCondition): Instruction {
  return {
    execute: (cpu: CPU) => {
      const address = cpu.nextWord.word
      if (CONDITIONS[condition](cpu)) {
        cpu.registers.PC.word = address
      }
    },
    cycles: 16,
    parameterBytes: 2,
    description: ([l, h]) =>
      `JP${CONDITION_NAMES[condition]} ${addressDisplay(combineBytes(h, l))}`,
  }
}

export const jpHl: Instruction = {
  execute(cpu) {
    cpu.registers.PC.word = cpu.registers.HL.word
  },
  cycles: 4,
  parameterBytes: 0,
  description: () => "JP HL",
}

export function rst(address: number): Instruction {
  return {
    execute(cpu) {
      const sp = cpu.registers.SP
      const pc = cpu.registers.PC

      const [h, l] = splitBytes(pc.word)

      cpu.memory.at(--sp.word).byte = h
      cpu.memory.at(--sp.word).byte = l

      pc.word = address
    },
    cycles: 16,
    parameterBytes: 0,
    description: () => `RST ${addressDisplay(address)}`,
  }
}
