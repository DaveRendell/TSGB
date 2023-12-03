import { addressDisplay } from "../../helpers/displayHexNumbers";
import { JumpCondition } from "../../types";
import { add } from "../arithmetic";
import CPU from "../cpu";
import { Instruction } from "../instruction";
import { combineBytes, from2sComplement } from "./instructionHelpers";

export const CONDITIONS: Record<JumpCondition, (cpu: CPU) => boolean> = {
  "Not-Zero": (cpu) => cpu.registers.getFlag("Zero").read() === 0,
  "Zero": (cpu) => cpu.registers.getFlag("Zero").read() === 1,
  "Not-Carry": (cpu) => cpu.registers.getFlag("Carry").read() === 0,
  "Carry": (cpu) => cpu.registers.getFlag("Carry").read() === 1,
  "None": () => true,
}

export const CONDITION_NAMES: Record<JumpCondition, string> = {
  "Not-Zero": "NZ",
  "Zero": "Z",
  "Not-Carry": "NC",
  "Carry": "C",
  "None": "",
}


export function jumpRelative(condition: JumpCondition): Instruction {
  return {
    execute: (cpu) => {
      const jump = from2sComplement(cpu.readNextByte())
      if (CONDITIONS[condition](cpu)) {
        add(cpu.registers.get16("PC"), jump)
      }
    },
    cycles: 12,
    parameterBytes: 1,
    description: ([value]) => `JR${CONDITION_NAMES[condition]} ${from2sComplement(value)}`
  }
}

export function jump(condition: JumpCondition): Instruction {
  return {
    execute: (cpu: CPU) => {
        if (CONDITIONS[condition](cpu)) {
          const l = cpu.readNextByte()
          const h = cpu.readNextByte()
          cpu.registers.get16("PC").write(combineBytes(h, l))
      }
    },
    cycles: 16,
    parameterBytes: 2,
    description: ([l, h]) => `JP${CONDITION_NAMES[condition]} ${addressDisplay(combineBytes(h, l))}`
  }
}

export const jpHl: Instruction = {
  execute(cpu) {
    cpu.registers.get16("PC").write(cpu.registers.get16("HL").read())
  },
  cycles: 4,
  parameterBytes: 0,
  description: () => "JP HL"
}

export function rst(location: number): Instruction {
  return {
    execute(cpu) {
      cpu.registers.get16("PC").write(location)
    },
    cycles: 16,
    parameterBytes: 0,
    description: () => `RST ${location}`
  }
}