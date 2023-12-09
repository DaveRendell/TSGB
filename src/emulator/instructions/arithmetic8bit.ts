import { valueDisplay } from "../../helpers/displayHexNumbers";
import { AluOperation, Register16Name, Register8Name, Target8Name } from "../../types";
import { add, decrement, increment } from "../arithmetic";
import CPU from "../cpu";
import { Instruction } from "../instruction";
import { from2sComplement, getByteDestination, getByteSource, splitBytes, to2sComplement } from "./instructionHelpers";

const splitToNibbles = (value: number) => [(value >> 4) & 0xF, value & 0xF]
const combineNibbles = (h: number, l: number) => (h << 4) + l

const OPERATIONS: Record<AluOperation, (cpu: CPU, value: number) => void> = {
  "ADD": (cpu, value) => {
    const a = cpu.registersOldQQ.get8("A")
    const [h, l] = splitToNibbles(value)
    const [hA, lA] = splitToNibbles(a.read())
    
    const hR = h + hA
    const lR = l + lA
    const r = combineNibbles(hR, lR)
    const rWrapped = r & 0xFF

    cpu.registersOldQQ.getFlag("Zero").write(rWrapped === 0 ? 1 : 0)
    cpu.registersOldQQ.getFlag("Operation").write(0)
    cpu.registersOldQQ.getFlag("Half-Carry").write(lR > 0xF ? 1 : 0)
    cpu.registersOldQQ.getFlag("Carry").write(rWrapped !== r ? 1 : 0)

    a.write(rWrapped)
  },
  "ADC": (cpu, value) => {
    const a = cpu.registersOldQQ.get8("A")
    const carry = cpu.registersOldQQ.getFlag("Carry").read()
    const [h, l] = splitToNibbles(value)
    const [hA, lA] = splitToNibbles(a.read())
    
    const hR = h + hA
    const lR = l + lA + carry
    const r = combineNibbles(hR, lR)
    const rWrapped = r & 0xFF

    cpu.registersOldQQ.getFlag("Zero").write(rWrapped === 0 ? 1 : 0)
    cpu.registersOldQQ.getFlag("Operation").write(0)
    cpu.registersOldQQ.getFlag("Half-Carry").write(lR > 0xF ? 1 : 0)
    cpu.registersOldQQ.getFlag("Carry").write(rWrapped !== r ? 1 : 0)

    a.write(rWrapped)
  },
  "SUB": (cpu, value) => {
    const a = cpu.registersOldQQ.get8("A")
    const [h, l] = splitToNibbles(value)
    const [hA, lA] = splitToNibbles(a.read())
    
    const hR = hA - h
    const lR = lA - l
    const r = combineNibbles(hR, lR)
    const rWrapped = r & 0xFF

    cpu.registersOldQQ.getFlag("Zero").write(rWrapped === 0 ? 1 : 0)
    cpu.registersOldQQ.getFlag("Operation").write(1)
    cpu.registersOldQQ.getFlag("Half-Carry").write(lR < 0 ? 1 : 0)
    cpu.registersOldQQ.getFlag("Carry").write(rWrapped !== r ? 1 : 0)

    a.write(rWrapped)
  },
  "SBC": (cpu, value) => {
    const a = cpu.registersOldQQ.get8("A")
    const carry = cpu.registersOldQQ.getFlag("Carry").read()
    const [h, l] = splitToNibbles(value)
    const [hA, lA] = splitToNibbles(a.read())
    
    const hR = hA - h
    const lR = lA - l - carry
    const r = combineNibbles(hR, lR)
    const rWrapped = r & 0xFF

    cpu.registersOldQQ.getFlag("Zero").write(rWrapped === 0 ? 1 : 0)
    cpu.registersOldQQ.getFlag("Operation").write(1)
    cpu.registersOldQQ.getFlag("Half-Carry").write(lR < 0 ? 1 : 0)
    cpu.registersOldQQ.getFlag("Carry").write(rWrapped !== r ? 1 : 0)

    a.write(rWrapped)
  },
  "AND": (cpu, value) => {
    const a = cpu.registersOldQQ.get8("A")
    
    const r = value & a.read()

    cpu.registersOldQQ.getFlag("Zero").write(r === 0 ? 1 : 0)
    cpu.registersOldQQ.getFlag("Operation").write(0)
    cpu.registersOldQQ.getFlag("Half-Carry").write(1)
    cpu.registersOldQQ.getFlag("Carry").write(0)

    a.write(r)
  },
  "XOR": (cpu, value) => {
    const a = cpu.registersOldQQ.get8("A")
    
    const r = value ^ a.read()

    cpu.registersOldQQ.getFlag("Zero").write(r === 0 ? 1 : 0)
    cpu.registersOldQQ.getFlag("Operation").write(0)
    cpu.registersOldQQ.getFlag("Half-Carry").write(0)
    cpu.registersOldQQ.getFlag("Carry").write(0)

    a.write(r)
  },
  "OR": (cpu, value) => {
    const a = cpu.registersOldQQ.get8("A")
    
    const r = value | a.read()

    cpu.registersOldQQ.getFlag("Zero").write(r === 0 ? 1 : 0)
    cpu.registersOldQQ.getFlag("Operation").write(0)
    cpu.registersOldQQ.getFlag("Half-Carry").write(0)
    cpu.registersOldQQ.getFlag("Carry").write(0)

    a.write(r)
  },
  "CP": (cpu, value) => {
    const a = cpu.registersOldQQ.get8("A")
    const [h, l] = splitToNibbles(value)
    const [hA, lA] = splitToNibbles(a.read())
    
    const hR = hA - h
    const lR = lA - l
    const r = combineNibbles(hR, lR)
    const rWrapped = r & 0xFF

    cpu.registersOldQQ.getFlag("Zero").write(rWrapped === 0 ? 1 : 0)
    cpu.registersOldQQ.getFlag("Operation").write(1)
    cpu.registersOldQQ.getFlag("Half-Carry").write(lR < 0 ? 1 : 0)
    cpu.registersOldQQ.getFlag("Carry").write(rWrapped !== r ? 1 : 0)
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

      cpu.registersOldQQ.getFlag("Zero").write(target.read() === 0 ? 1 : 0)
      cpu.registersOldQQ.getFlag("Operation").write(0)
      cpu.registersOldQQ.getFlag("Half-Carry").write((target.read() & 0xF) === 0 ? 1 : 0)
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

      cpu.registersOldQQ.getFlag("Zero").write(target.read() === 0 ? 1 : 0)
      cpu.registersOldQQ.getFlag("Operation").write(1)
      cpu.registersOldQQ.getFlag("Half-Carry").write((target.read() & 0xF) === 0x0F ? 1 : 0)
    },
    cycles: targetName === "M" ? 12 : 4,
    parameterBytes: 0,
    description: () => `DEC ${targetName}`
  }
}

export function increment16Bit(targetName: Register16Name): Instruction {
  return {
    execute: (cpu) => {
      increment(cpu.registersOldQQ.get16(targetName))
    },
    cycles: 8,
    parameterBytes: 0,
    description: () => `INC ${targetName}`
  }
}

export function decrement16Bit(targetName: Register16Name): Instruction {
  return {
    execute: (cpu) => {
      decrement(cpu.registersOldQQ.get16(targetName))
    },
    cycles: 8,
    parameterBytes: 0,
    description: () => `DEC ${targetName}`
  }
}

export function rotateLeft(registerName: Target8Name, throughCarry: boolean, isPrefixed: boolean, setZero = true): Instruction {
  const commandName = throughCarry ? "RL" : "RLC"
  return {
    execute: (cpu) => {
      const register = getByteDestination(registerName, cpu)
      const value = register.read()
      const wrap = throughCarry ? cpu.registersOldQQ.getFlag("Carry").read() : value >> 7
      const rotated = ((value << 1) & 0xFF) + wrap
      register.write(rotated)

      cpu.registersOldQQ.getFlag("Zero").write(setZero && rotated === 0 ? 1 : 0)
      cpu.registersOldQQ.getFlag("Operation").write(0)
      cpu.registersOldQQ.getFlag("Half-Carry").write(0)
      cpu.registersOldQQ.getFlag("Carry").write(value >> 7)
    },
    cycles: isPrefixed ? registerName === "M" ? 12 : 8 : 4,
    parameterBytes: 0,
    description: () => `${commandName} ${registerName}`
  }
}

export function rotateRight(registerName: Target8Name, throughCarry: boolean, isPrefixed: boolean, setZero = true): Instruction {
  const commandName = throughCarry ? "RR" : "RRC"
  return {
    execute: (cpu) => {
      const register = getByteDestination(registerName, cpu)
      const value = register.read()
      const wrap = throughCarry ? cpu.registersOldQQ.getFlag("Carry").read() : (value & 1)
      const rotated = (value >> 1) + (wrap << 7)
      register.write(rotated)

      cpu.registersOldQQ.getFlag("Zero").write(setZero && rotated === 0 ? 1 : 0)
      cpu.registersOldQQ.getFlag("Operation").write(0)
      cpu.registersOldQQ.getFlag("Half-Carry").write(0)
      cpu.registersOldQQ.getFlag("Carry").write(value & 1)
    },
    cycles: isPrefixed ? registerName === "M" ? 12 : 8 : 4,
    parameterBytes: 0,
    description: () => `${commandName} ${registerName}`
  }
}

export const cpl: Instruction = {
  execute: (cpu) => {
    const a = cpu.registersOldQQ.get8("A")
    a.write(~a.read())
    cpu.registersOldQQ.getFlag("Operation").write(1)
    cpu.registersOldQQ.getFlag("Half-Carry").write(1)
  },
  cycles: 4,
  parameterBytes: 0,
  description: () => "CPL"
}

export const addToHL = (registerName: Register16Name): Instruction => {
  return {
    execute(cpu) {
      const hl = cpu.registersOldQQ.get16("HL")
      const r = cpu.registersOldQQ.get16(registerName)

      const hlValue = hl.read()
      const rValue = r.read()

      const result = hlValue + rValue

      hl.write(result & 0xFFFF)

      const halfCarry = ((hlValue & 0x0FFF) + (rValue & 0x0FFF)) > 0xFFF

      cpu.registersOldQQ.getFlag("Operation").write(0)
      cpu.registersOldQQ.getFlag("Half-Carry").write(halfCarry ? 1 : 0)
      cpu.registersOldQQ.getFlag("Carry").write(result > 0xFFFF ? 1 : 0)
    },
    cycles: 8,
    parameterBytes: 0,
    description: () => `ADD HL,${registerName}`
  }
}

export const addImmediateToSP: Instruction = {
  execute(cpu) {
    const sp = cpu.registersOldQQ.get16("SP")
    const amount = from2sComplement(cpu.nextByte.read())

    const oldValue = sp.read()
    const newValue = oldValue + amount

    const halfCarry = (oldValue & 0xF) + (amount & 0xF) > 0xF
    const carry = (oldValue & 0xFF) + (amount & 0xFF) > 0xFF

    sp.write(newValue & 0xFFFF)

    cpu.registersOldQQ.getFlag("Zero").write(0)
    cpu.registersOldQQ.getFlag("Operation").write(0)
    cpu.registersOldQQ.getFlag("Half-Carry").write(halfCarry ? 1 : 0)
    cpu.registersOldQQ.getFlag("Carry").write(carry ? 1 : 0)
  },
  cycles: 16,
  parameterBytes: 1,
  description: ([value]) => `ADD SP,${valueDisplay(value)}`
}

export const daa: Instruction = {
  execute(cpu) {
    const a = cpu.registersOldQQ.get8("A")
    const operation = cpu.registersOldQQ.getFlag("Operation").read()
    const halfCarry = cpu.registersOldQQ.getFlag("Half-Carry")
    const carry = cpu.registersOldQQ.getFlag("Carry")

    const value = a.read()

    let correction = 0

    let setCarry = false
    if (halfCarry.read() || (!operation && (value & 0xF) > 9)) {
      correction |= 0x6
    }
    if (carry.read() || (!operation && value > 0x99)) {
      correction |= 0x60
      setCarry = true
    }

    const result = value + (operation ? -correction : correction)

    a.write(result & 0xFF)

    carry.write(setCarry ? 1 : 0)
    halfCarry.write(0)
    cpu.registersOldQQ.getFlag("Zero").write((result & 0xFF) === 0 ? 1 : 0)
  },
  cycles: 4,
  parameterBytes: 0,
  description: () => "DAA"
}