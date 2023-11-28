import { Target8Name } from "../../types"
import { Instruction } from "../instruction"
import { getByteDestination } from "./instructionHelpers"

export const testBit = (bit: number, sourceName: Target8Name): Instruction => {
  return {
    execute: (cpu) => {
      const source = getByteDestination(sourceName, cpu)
      const result = (source.read() >> bit) & 0b1

      cpu.registers.getFlag("Zero").write(result === 0 ? 1 : 0)
      cpu.registers.getFlag("Operation").write(0)
      cpu.registers.getFlag("Half-Carry").write(1)
    },
    cycles: sourceName === "M" ? 12 : 8,
    parameterBytes: 0,
    description: () => `BIT ${bit},${sourceName}`
  }
}