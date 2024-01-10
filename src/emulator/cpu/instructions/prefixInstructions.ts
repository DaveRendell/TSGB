import { Instruction } from "./instruction"
import { ByteLocation, getByteRef } from "./instructionHelpers"

export const testBit = (bit: number, sourceName: ByteLocation): Instruction => {
  return {
    execute: (cpu) => {
      const source = getByteRef(sourceName, cpu)
      const result = (source.byte >> bit) & 0b1

      cpu.registers.F.zero = result == 0
      cpu.registers.F.operation = false
      cpu.registers.F.halfCarry = true
    },
    cycles: sourceName === ByteLocation.M ? 12 : 8,
    parameterBytes: 0,
    description: () => `BIT ${bit},${sourceName}`,
  }
}

export const resetBit = (
  bit: number,
  sourceName: ByteLocation,
): Instruction => {
  return {
    execute: (cpu) => {
      const source = getByteRef(sourceName, cpu)
      source.byte &= ~(1 << bit)
    },
    cycles: sourceName === ByteLocation.M ? 16 : 8,
    parameterBytes: 0,
    description: () => `RES ${bit},${sourceName}`,
  }
}

export const setBit = (bit: number, sourceName: ByteLocation): Instruction => {
  return {
    execute: (cpu) => {
      const source = getByteRef(sourceName, cpu)
      source.byte |= 1 << bit
    },
    cycles: sourceName === ByteLocation.M ? 16 : 8,
    parameterBytes: 0,
    description: () => `SET ${bit},${sourceName}`,
  }
}

export const swap = (sourceName: ByteLocation): Instruction => {
  return {
    execute(cpu) {
      const byte = getByteRef(sourceName, cpu)
      const originalValue = byte.byte
      const h = (originalValue & 0xf0) >> 4
      const l = originalValue & 0x0f
      const newValue = (l << 4) + h
      byte.byte = newValue

      cpu.registers.F.zero = newValue == 0
      cpu.registers.F.operation = false
      cpu.registers.F.halfCarry = false
      cpu.registers.F.carry = false
    },
    cycles: sourceName === ByteLocation.M ? 12 : 8,
    parameterBytes: 0,
    description: () => `SWAP ${sourceName}`,
  }
}

export const shiftRightLogical = (sourceName: ByteLocation): Instruction => {
  return {
    execute(cpu) {
      const byte = getByteRef(sourceName, cpu)
      const originalValue = byte.byte
      const newValue = originalValue >> 1

      byte.byte = newValue

      cpu.registers.F.zero = newValue == 0
      cpu.registers.F.operation = false
      cpu.registers.F.halfCarry = false
      cpu.registers.F.carry = (originalValue & 1) > 0
    },
    cycles: 8,
    parameterBytes: 0,
    description: () => `SRL ${sourceName}`,
  }
}

export function shiftLeftArithmetic(sourceName: ByteLocation): Instruction {
  return {
    execute(cpu) {
      const source = getByteRef(sourceName, cpu)

      const oldValue = source.byte
      const newValue = ((oldValue << 1) & 0xff) + 0

      source.byte = newValue

      cpu.registers.F.zero = newValue == 0
      cpu.registers.F.operation = false
      cpu.registers.F.halfCarry = false
      cpu.registers.F.carry = (oldValue & 0x80) > 0
    },
    cycles: sourceName === ByteLocation.M ? 16 : 8,
    parameterBytes: 0,
    description: () => `SRA ${sourceName}`,
  }
}

export function shiftRightArithmetic(sourceName: ByteLocation): Instruction {
  return {
    execute(cpu) {
      const source = getByteRef(sourceName, cpu)

      const oldValue = source.byte
      const newValue = (oldValue >> 1) + (oldValue & 0x80)

      source.byte = newValue

      cpu.registers.F.zero = newValue == 0
      cpu.registers.F.operation = false
      cpu.registers.F.halfCarry = false
      cpu.registers.F.carry = (oldValue & 1) > 0
    },
    cycles: sourceName === ByteLocation.M ? 16 : 8,
    parameterBytes: 0,
    description: () => `SRA ${sourceName}`,
  }
}
