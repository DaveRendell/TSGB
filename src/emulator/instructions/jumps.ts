import { valueDisplay } from "../../helpers/displayHexNumbers";
import { JumpCondition } from "../../types";
import { add, decrement, increment } from "../arithmetic";
import CPU from "../cpu";
import { Instruction } from "../instruction";
import { from2sComplement } from "./instructionHelpers";

const CONDITIONS: Record<JumpCondition, (cpu: CPU) => boolean> = {
  "Not-Zero": (cpu) => cpu.registers.getFlag("Zero").read() === 0,
  "Zero": (cpu) => cpu.registers.getFlag("Zero").read() === 1,
  "Not-Carry": (cpu) => cpu.registers.getFlag("Carry").read() === 0,
  "Carry": (cpu) => cpu.registers.getFlag("Carry").read() === 1,
}

const CONDITION_NAMES: Record<JumpCondition, string> = {
  "Not-Zero": "NZ",
  "Zero": "Z",
  "Not-Carry": "NC",
  "Carry": "C",
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