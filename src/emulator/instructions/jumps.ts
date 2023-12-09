import { addressDisplay } from "../../helpers/displayHexNumbers";
import { JumpCondition } from "../../types";
import { add, decrement } from "../arithmetic";
import CPU from "../cpu";
import { Instruction } from "../instruction";
import { combineBytes, from2sComplement, splitBytes } from "./instructionHelpers";

export const CONDITIONS: Record<JumpCondition, (cpu: CPU) => boolean> = {
  "Not-Zero": (cpu) => cpu.registersOldQQ.getFlag("Zero").read() === 0,
  "Zero": (cpu) => cpu.registersOldQQ.getFlag("Zero").read() === 1,
  "Not-Carry": (cpu) => cpu.registersOldQQ.getFlag("Carry").read() === 0,
  "Carry": (cpu) => cpu.registersOldQQ.getFlag("Carry").read() === 1,
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
        add(cpu.registersOldQQ.get16("PC"), jump)
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
        const l = cpu.readNextByte()
        const h = cpu.readNextByte()
        if (CONDITIONS[condition](cpu)) {
          cpu.registersOldQQ.get16("PC").write(combineBytes(h, l))
      }
    },
    cycles: 16,
    parameterBytes: 2,
    description: ([l, h]) => `JP${CONDITION_NAMES[condition]} ${addressDisplay(combineBytes(h, l))}`
  }
}

export const jpHl: Instruction = {
  execute(cpu) {
    cpu.registersOldQQ.get16("PC").write(cpu.registersOldQQ.get16("HL").read())
  },
  cycles: 4,
  parameterBytes: 0,
  description: () => "JP HL"
}

export function rst(address: number): Instruction {
  return {
    execute(cpu) {
      const sp = cpu.registersOldQQ.get16("SP")
      const pc = cpu.registersOldQQ.get16("PC")

      const [h, l] = splitBytes(pc.read())

      decrement(sp)
      cpu.memory.atOldQQ(sp.read()).write(h)
      decrement(sp)
      cpu.memory.atOldQQ(sp.read()).write(l)

      pc.write(address)
    },
    cycles: 16,
    parameterBytes: 0,
    description: () => `RST ${addressDisplay(address)}`
  }
}