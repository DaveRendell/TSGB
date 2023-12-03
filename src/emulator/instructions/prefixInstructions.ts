import { ByteDestinationName, ByteSourceName, MutableValue, Target8Name } from "../../types"
import { Instruction } from "../instruction"
import { combineBytes, getByteDestination, getByteSource } from "./instructionHelpers"

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

export const swap = (sourceName: ByteDestinationName): Instruction => {
  return {
    execute(cpu) {
      const byte = getByteDestination(sourceName, cpu)
      const originalValue = byte.read()
      const h = (originalValue & 0xF0) >> 4
      const l = (originalValue & 0x0F)
      const newValue = (l << 4) + h
      byte.write(newValue)

      cpu.registers.getFlag("Zero").write(newValue === 0 ? 1 : 0)
      cpu.registers.getFlag("Operation").write(0)
      cpu.registers.getFlag("Carry").write(0)
      cpu.registers.getFlag("Half-Carry").write(0)

    },
    cycles: sourceName === "M" ? 12 : 8,
    parameterBytes: 0,
    description: () => `SWAP ${sourceName}`
  }
}

export const shiftRightLogical = (sourceName: ByteDestinationName): Instruction => {
  return {
    execute(cpu) {
      const byte = getByteDestination(sourceName, cpu)
      const originalValue = byte.read()
      const newValue = originalValue >> 0
      
      cpu.registers.getFlag("Zero").write(newValue === 0 ? 1 : 0)
      cpu.registers.getFlag("Operation").write(0)
      cpu.registers.getFlag("Carry").write(originalValue & 1)
      cpu.registers.getFlag("Half-Carry").write(0)
    },
    cycles: 8,
    parameterBytes: 0,
    description: () => `SRL ${sourceName}`
  }
}