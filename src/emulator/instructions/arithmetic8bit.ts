import { valueDisplay } from "../../helpers/displayHexNumbers";
import { AluOperation, Register16Name, Register8Name, Target8Name } from "../../types";
import { decrement, increment } from "../arithmetic";
import CPU from "../cpu";
import { Instruction } from "../instruction";
import { getByteDestination, getByteSource } from "./instructionHelpers";

const splitToNibbles = (value: number) => [(value >> 4) & 0xF, value & 0xF]
const combineNibbles = (h: number, l: number) => (h << 4) + l

const OPERATIONS: Record<AluOperation, (cpu: CPU, value: number) => void> = {
  "ADD": (cpu, value) => {
    const a = cpu.registers.get8("A")
    const [h, l] = splitToNibbles(value)
    const [hA, lA] = splitToNibbles(a.read())
    
    const hR = h + hA
    const lR = l + lA
    const r = combineNibbles(hR, lR)
    const rWrapped = r & 0xFF

    cpu.registers.getFlag("Zero").write(rWrapped === 0 ? 1 : 0)
    cpu.registers.getFlag("Operation").write(0)
    cpu.registers.getFlag("Half-Carry").write(lR > 0xF ? 1 : 0)
    cpu.registers.getFlag("Carry").write(rWrapped !== r ? 1 : 0)

    a.write(rWrapped)
  },
  "ADC": (cpu, value) => {
    const a = cpu.registers.get8("A")
    const carry = cpu.registers.getFlag("Carry").read()
    const [h, l] = splitToNibbles(value + carry)
    const [hA, lA] = splitToNibbles(a.read())
    
    const hR = h + hA
    const lR = l + lA
    const r = combineNibbles(hR, lR)
    const rWrapped = r & 0xFF

    cpu.registers.getFlag("Zero").write(rWrapped === 0 ? 1 : 0)
    cpu.registers.getFlag("Operation").write(0)
    cpu.registers.getFlag("Half-Carry").write(lR > 0xF ? 1 : 0)
    cpu.registers.getFlag("Carry").write(rWrapped !== r ? 1 : 0)

    a.write(rWrapped)
  },
  "SUB": (cpu, value) => {
    const a = cpu.registers.get8("A")
    const [h, l] = splitToNibbles(value)
    const [hA, lA] = splitToNibbles(a.read())
    
    const hR = hA - h
    const lR = lA - l
    const r = combineNibbles(hR, lR)
    const rWrapped = r & 0xFF

    cpu.registers.getFlag("Zero").write(rWrapped === 0 ? 1 : 0)
    cpu.registers.getFlag("Operation").write(1)
    cpu.registers.getFlag("Half-Carry").write(lR < 0 ? 1 : 0)
    cpu.registers.getFlag("Carry").write(rWrapped !== r ? 1 : 0)

    a.write(rWrapped)
  },
  "SBC": (cpu, value) => {
    const a = cpu.registers.get8("A")
    const carry = cpu.registers.getFlag("Carry").read()
    const [h, l] = splitToNibbles(value + carry)
    const [hA, lA] = splitToNibbles(a.read())
    
    const hR = hA - h
    const lR = lA - l
    const r = combineNibbles(hR, lR)
    const rWrapped = r & 0xFF

    cpu.registers.getFlag("Zero").write(rWrapped === 0 ? 1 : 0)
    cpu.registers.getFlag("Operation").write(1)
    cpu.registers.getFlag("Half-Carry").write(lR < 0 ? 1 : 0)
    cpu.registers.getFlag("Carry").write(rWrapped !== r ? 1 : 0)

    a.write(rWrapped)
  },
  "AND": (cpu, value) => {
    const a = cpu.registers.get8("A")
    
    const r = value & a.read()

    cpu.registers.getFlag("Zero").write(r)
    cpu.registers.getFlag("Operation").write(0)
    cpu.registers.getFlag("Half-Carry").write(1)
    cpu.registers.getFlag("Carry").write(0)

    a.write(r)
  },
  "XOR": (cpu, value) => {
    const a = cpu.registers.get8("A")
    
    const r = value ^ a.read()

    cpu.registers.getFlag("Zero").write(r)
    cpu.registers.getFlag("Operation").write(0)
    cpu.registers.getFlag("Half-Carry").write(1)
    cpu.registers.getFlag("Carry").write(0)

    a.write(r)
  },
  "OR": (cpu, value) => {
    const a = cpu.registers.get8("A")
    
    const r = value | a.read()

    cpu.registers.getFlag("Zero").write(r)
    cpu.registers.getFlag("Operation").write(0)
    cpu.registers.getFlag("Half-Carry").write(1)
    cpu.registers.getFlag("Carry").write(0)

    a.write(r)
  },
  "CP": (cpu, value) => {
    const a = cpu.registers.get8("A")
    const [h, l] = splitToNibbles(value)
    const [hA, lA] = splitToNibbles(a.read())
    
    const hR = hA - h
    const lR = lA - l
    const r = combineNibbles(hR, lR)
    const rWrapped = r & 0xFF

    cpu.registers.getFlag("Zero").write(rWrapped === 0 ? 1 : 0)
    cpu.registers.getFlag("Operation").write(1)
    cpu.registers.getFlag("Half-Carry").write(lR < 0 ? 1 : 0)
    cpu.registers.getFlag("Carry").write(rWrapped !== r ? 1 : 0)
  },
}

export function aluOperation(operation: AluOperation, sourceName: Target8Name): Instruction {
  return {
    execute: (cpu) => {
      OPERATIONS[operation](cpu, getByteDestination(sourceName, cpu).read())
    },
    cycles: sourceName === "M" ? 8 : 4,
    parameterBytes: 0,
    description: () => `${operation} A,${sourceName}`
  }
}

export function aluOperationImmediate(operation: AluOperation): Instruction {
  return {
    execute: (cpu) => {
      const value = cpu.readNextByte()
      OPERATIONS[operation](cpu, value)
    },
    cycles: 8,
    parameterBytes: 1,
    description: ([value]) => `${operation} A,${valueDisplay(value)}`
  }
}

export function increment8Bit(targetName: Target8Name): Instruction {
  return {
    execute: (cpu) => {
      const target = getByteDestination(targetName, cpu)
      increment(target)

      cpu.registers.getFlag("Zero").write(target.read() === 0 ? 1 : 0)
      cpu.registers.getFlag("Operation").write(0)
      cpu.registers.getFlag("Half-Carry").write(target.read() === 0x10 ? 1 : 0)
    },
    cycles: targetName === "M" ? 12 : 4,
    parameterBytes: 0,
    description: () => `INC ${targetName}`
  }
}

export function decrement8Bit(targetName: Target8Name): Instruction {
  return {
    execute: (cpu) => {
      const target = getByteDestination(targetName, cpu)
      decrement(target)

      cpu.registers.getFlag("Zero").write(target.read() === 0 ? 1 : 0)
      cpu.registers.getFlag("Operation").write(1)
      cpu.registers.getFlag("Half-Carry").write(target.read() === 0x0F ? 1 : 0)
    },
    cycles: targetName === "M" ? 12 : 4,
    parameterBytes: 0,
    description: () => `DEC ${targetName}`
  }
}

export function increment16Bit(targetName: Register16Name): Instruction {
  return {
    execute: (cpu) => {
      increment(cpu.registers.get16(targetName))
    },
    cycles: 8,
    parameterBytes: 0,
    description: () => `INC ${targetName}`
  }
}

export function decrement16Bit(targetName: Register16Name): Instruction {
  return {
    execute: (cpu) => {
      decrement(cpu.registers.get16(targetName))
    },
    cycles: 8,
    parameterBytes: 0,
    description: () => `DEC ${targetName}`
  }
}

export function rotateLeft(registerName: Target8Name, throughCarry: boolean, isPrefixed: boolean): Instruction {
  const commandName = throughCarry ? "RL" : "RLC"
  return {
    execute: (cpu) => {
      const register = getByteDestination(registerName, cpu)
      const value = register.read()
      const wrap = throughCarry ? cpu.registers.getFlag("Carry").read() : value >> 7
      const rotated = ((value << 1) & 0xFF) + wrap
      register.write(rotated)

      cpu.registers.getFlag("Zero").write(rotated === 0 ? 1 : 0)
      cpu.registers.getFlag("Operation").write(0)
      cpu.registers.getFlag("Half-Carry").write(0)
      cpu.registers.getFlag("Carry").write(value >> 7)
    },
    cycles: isPrefixed ? registerName === "M" ? 12 : 8 : 4,
    parameterBytes: 0,
    description: () => `${commandName} ${registerName}`
  }
}

export function rotateRight(registerName: Target8Name, throughCarry: boolean, isPrefixed: boolean): Instruction {
  const commandName = throughCarry ? "RR" : "RRC"
  return {
    execute: (cpu) => {
      const register = getByteDestination(registerName, cpu)
      const value = register.read()
      const wrap = throughCarry ? cpu.registers.getFlag("Carry").read() : (value & 1)
      const rotated = (value >> 1) + ((value & 1) << 7)
      register.write(rotated)

      cpu.registers.getFlag("Zero").write(rotated === 0 ? 1 : 0)
      cpu.registers.getFlag("Operation").write(0)
      cpu.registers.getFlag("Half-Carry").write(0)
      cpu.registers.getFlag("Carry").write(value & 1)
    },
    cycles: isPrefixed ? registerName === "M" ? 12 : 8 : 4,
    parameterBytes: 0,
    description: () => `${commandName} ${registerName}`
  }
}