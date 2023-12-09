import { ByteDestinationName, ByteSourceName, MutableValue, Target8Name } from "../../types"
import { Instruction } from "../instruction"
import { combineBytes, getByteDestination, getByteSource } from "./instructionHelpers"

export const testBit = (bit: number, sourceName: Target8Name): Instruction => {
  return {
    execute: (cpu) => {
      const source = getByteDestination(sourceName, cpu)
      const result = (source.read() >> bit) & 0b1

      cpu.registersOldQQ.getFlag("Zero").write(result === 0 ? 1 : 0)
      cpu.registersOldQQ.getFlag("Operation").write(0)
      cpu.registersOldQQ.getFlag("Half-Carry").write(1)
    },
    cycles: sourceName === "M" ? 12 : 8,
    parameterBytes: 0,
    description: () => `BIT ${bit},${sourceName}`
  }
}

export const resetBit = (bit: number, sourceName: Target8Name): Instruction => {
  return {
    execute: (cpu) => {
      const source = getByteDestination(sourceName, cpu)
      source.write(source.read() & ~(1 << bit))
    },
    cycles: sourceName === "M" ? 16 : 8,
    parameterBytes: 0,
    description: () => `RES ${bit},${sourceName}`
  }
}

export const setBit = (bit: number, sourceName: Target8Name): Instruction => {
  return {
    execute: (cpu) => {
      const source = getByteDestination(sourceName, cpu)
      source.write(source.read() | (1 << bit))

    },
    cycles: sourceName === "M" ? 16 : 8,
    parameterBytes: 0,
    description: () => `SET ${bit},${sourceName}`
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

      cpu.registersOldQQ.getFlag("Zero").write(newValue === 0 ? 1 : 0)
      cpu.registersOldQQ.getFlag("Operation").write(0)
      cpu.registersOldQQ.getFlag("Carry").write(0)
      cpu.registersOldQQ.getFlag("Half-Carry").write(0)

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
      const newValue = originalValue >> 1

      byte.write(newValue)
      
      cpu.registersOldQQ.getFlag("Zero").write(newValue === 0 ? 1 : 0)
      cpu.registersOldQQ.getFlag("Operation").write(0)
      cpu.registersOldQQ.getFlag("Carry").write(originalValue & 1)
      cpu.registersOldQQ.getFlag("Half-Carry").write(0)
    },
    cycles: 8,
    parameterBytes: 0,
    description: () => `SRL ${sourceName}`
  }
}

export function shiftLeftArithmetic(sourceName: ByteDestinationName): Instruction {
  return {
    execute(cpu) {
      const source = getByteDestination(sourceName, cpu)

      const oldValue = source.read()
      const newValue = ((oldValue << 1) & 0xFF) + 0

      source.write(newValue)

      cpu.registersOldQQ.getFlag("Zero").write(newValue === 0 ? 1 : 0)
      cpu.registersOldQQ.getFlag("Operation").write(0)
      cpu.registersOldQQ.getFlag("Half-Carry").write(0)
      cpu.registersOldQQ.getFlag("Carry").write(oldValue & 0x80)
    },
    cycles: sourceName === "M" ? 16 : 8,
    parameterBytes: 0,
    description: () => `SRA ${sourceName}`
  }
}

export function shiftRightArithmetic(sourceName: ByteDestinationName): Instruction {
  return {
    execute(cpu) {
      const source = getByteDestination(sourceName, cpu)

      const oldValue = source.read()
      const newValue = (oldValue >> 1) + (oldValue & 0x80)

      source.write(newValue)

      cpu.registersOldQQ.getFlag("Zero").write(newValue === 0 ? 1 : 0)
      cpu.registersOldQQ.getFlag("Operation").write(0)
      cpu.registersOldQQ.getFlag("Half-Carry").write(0)
      cpu.registersOldQQ.getFlag("Carry").write(oldValue & 0x1)
    },
    cycles: sourceName === "M" ? 16 : 8,
    parameterBytes: 0,
    description: () => `SRA ${sourceName}`
  }
}