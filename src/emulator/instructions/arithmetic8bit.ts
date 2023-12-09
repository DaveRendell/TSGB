import { valueDisplay } from "../../helpers/displayHexNumbers";
import { AluOperation, Register16Name, Register8Name, Target8Name } from "../../types";
import { add, decrement, increment } from "../arithmetic";
import CPU from "../cpu";
import { Instruction } from "../instruction";
import { ByteLocation, WordLocation, from2sComplement, getByteRef, getWordRef, splitBytes, to2sComplement } from "./instructionHelpers";

const splitToNibbles = (value: number) => [(value >> 4) & 0xF, value & 0xF]
const combineNibbles = (h: number, l: number) => (h << 4) + l

const OPERATIONS: Record<AluOperation, (cpu: CPU, value: number) => void> = {
  "ADD": (cpu, value) => {
    const a = cpu.registers.A
    const [h, l] = splitToNibbles(value)
    const [hA, lA] = splitToNibbles(a.value)
    
    const hR = h + hA
    const lR = l + lA
    const r = combineNibbles(hR, lR)
    const rWrapped = r & 0xFF

    a.value = rWrapped

    cpu.registers.F.zero = rWrapped == 0
    cpu.registers.F.operation = false
    cpu.registers.F.halfCarry = lR > 0xF
    cpu.registers.F.carry = rWrapped != r
  },
  "ADC": (cpu, value) => {
    const a = cpu.registers.A
    const carry = cpu.registers.F.carry ? 1 : 0
    const [h, l] = splitToNibbles(value)
    const [hA, lA] = splitToNibbles(a.value)
    
    const hR = h + hA
    const lR = l + lA + carry
    const r = combineNibbles(hR, lR)
    const rWrapped = r & 0xFF

    a.value = rWrapped

    cpu.registers.F.zero = rWrapped == 0
    cpu.registers.F.operation = false
    cpu.registers.F.halfCarry = lR > 0xF
    cpu.registers.F.carry = rWrapped != r
  },
  "SUB": (cpu, value) => {
    const a = cpu.registers.A
    const [h, l] = splitToNibbles(value)
    const [hA, lA] = splitToNibbles(a.value)
    
    const hR = hA - h
    const lR = lA - l
    const r = combineNibbles(hR, lR)
    const rWrapped = r & 0xFF

    a.value = rWrapped

    cpu.registers.F.zero = rWrapped == 0
    cpu.registers.F.operation = true
    cpu.registers.F.halfCarry = lR < 0
    cpu.registers.F.carry = rWrapped != r
  },
  "SBC": (cpu, value) => {
    const a = cpu.registers.A
    const carry = cpu.registers.F.carry ? 1 : 0
    const [h, l] = splitToNibbles(value)
    const [hA, lA] = splitToNibbles(a.value)
    
    const hR = hA - h
    const lR = lA - l - carry
    const r = combineNibbles(hR, lR)
    const rWrapped = r & 0xFF

    a.value = rWrapped

    cpu.registers.F.zero = rWrapped == 0
    cpu.registers.F.operation = true
    cpu.registers.F.halfCarry = lR < 0
    cpu.registers.F.carry = rWrapped != r
  },
  "AND": (cpu, value) => {
    const a = cpu.registers.A

    a.value &= value

    cpu.registers.F.zero = a.value === 0
    cpu.registers.F.operation = false
    cpu.registers.F.halfCarry = true
    cpu.registers.F.carry = false
  },
  "XOR": (cpu, value) => {
    const a = cpu.registers.A
  
    a.value ^= value

    cpu.registers.F.zero = a.value === 0
    cpu.registers.F.operation = false
    cpu.registers.F.halfCarry = false
    cpu.registers.F.carry = false
  },
  "OR": (cpu, value) => {
    const a = cpu.registers.A

    a.value |= value

    cpu.registers.F.zero = a.value === 0
    cpu.registers.F.operation = false
    cpu.registers.F.halfCarry = false
    cpu.registers.F.carry = false
  },
  "CP": (cpu, value) => {
    const a = cpu.registers.A
    const [h, l] = splitToNibbles(value)
    const [hA, lA] = splitToNibbles(a.value)
    
    const hR = hA - h
    const lR = lA - l
    const r = combineNibbles(hR, lR)
    const rWrapped = r & 0xFF

    cpu.registers.F.zero = rWrapped == 0
    cpu.registers.F.operation = true
    cpu.registers.F.halfCarry = lR < 0
    cpu.registers.F.carry = rWrapped != r
  },
}

export function aluOperation(operation: AluOperation, sourceName: ByteLocation): Instruction {
  return {
    execute: (cpu) => {
      OPERATIONS[operation](cpu, getByteRef(sourceName, cpu).value)
    },
    cycles: sourceName === ByteLocation.M ? 8 : 4,
    parameterBytes: 0,
    description: () => `${operation} A,${sourceName}`
  }
}

export function aluOperationImmediate(operation: AluOperation): Instruction {
  return {
    execute: (cpu) => {
      const value = cpu.nextByte.value
      OPERATIONS[operation](cpu, value)
    },
    cycles: 8,
    parameterBytes: 1,
    description: ([value]) => `${operation} A,${valueDisplay(value)}`
  }
}

export function increment8Bit(targetName: ByteLocation): Instruction {
  return {
    execute: (cpu) => {
      const target = getByteRef(targetName, cpu)
      target.value++

      cpu.registers.F.zero = target.value == 0
      cpu.registers.F.operation = false
      cpu.registers.F.halfCarry = (target.value & 0xF) === 0
    },
    cycles: targetName === ByteLocation.M ? 12 : 4,
    parameterBytes: 0,
    description: () => `INC ${targetName}`
  }
}

export function decrement8Bit(targetName: ByteLocation): Instruction {
  return {
    execute: (cpu) => {
      const target = getByteRef(targetName, cpu)
      target.value--

      cpu.registers.F.zero = target.value == 0
      cpu.registers.F.operation = false
      cpu.registers.F.halfCarry = (target.value & 0xF) === 0xF
    },
    cycles: targetName === ByteLocation.M ? 12 : 4,
    parameterBytes: 0,
    description: () => `DEC ${targetName}`
  }
}

export function increment16Bit(register: WordLocation): Instruction {
  return {
    execute: (cpu) => {
      getWordRef(register, cpu).value++
    },
    cycles: 8,
    parameterBytes: 0,
    description: () => `INC ${register}`
  }
}

export function decrement16Bit(register: WordLocation): Instruction {
  return {
    execute: (cpu) => {
      getWordRef(register, cpu).value--
    },
    cycles: 8,
    parameterBytes: 0,
    description: () => `DEC ${register}`
  }
}

export function rotateLeft(
  registerName: ByteLocation,
  throughCarry: boolean,
  isPrefixed: boolean,
  setZero = true
): Instruction {
  const commandName = throughCarry ? "RL" : "RLC"
  return {
    execute: (cpu) => {
      const register = getByteRef(registerName, cpu)
      const value = register.value
      const wrap = throughCarry ? cpu.registers.F.carry ? 1 : 0 : value >> 7
      const rotated = ((value << 1) & 0xFF) + wrap
      register.value = rotated

      cpu.registers.F.zero = setZero && rotated === 0
      cpu.registers.F.operation = false
      cpu.registers.F.halfCarry = false
      cpu.registers.F.carry = value >> 7 > 0
    },
    cycles: isPrefixed ? registerName === ByteLocation.M ? 12 : 8 : 4,
    parameterBytes: 0,
    description: () => `${commandName} ${registerName}`
  }
}

export function rotateRight(registerName: ByteLocation, throughCarry: boolean, isPrefixed: boolean, setZero = true): Instruction {
  const commandName = throughCarry ? "RR" : "RRC"
  return {
    execute: (cpu) => {
      const register = getByteRef(registerName, cpu)
      const value = register.value
      const wrap = throughCarry ? cpu.registers.F.carry ? 1 : 0 : (value & 1)
      const rotated = (value >> 1) + (wrap << 7)
      register.value = rotated

      cpu.registers.F.zero = setZero && rotated === 0
      cpu.registers.F.operation = false
      cpu.registers.F.halfCarry = false
      cpu.registers.F.carry = (value & 1) > 0
    },
    cycles: isPrefixed ? registerName === ByteLocation.M ? 12 : 8 : 4,
    parameterBytes: 0,
    description: () => `${commandName} ${registerName}`
  }
}

export const cpl: Instruction = {
  execute: (cpu) => {
    ~cpu.registers.A.value
    
    cpu.registers.F.operation = true
    cpu.registers.F.halfCarry = true
  },
  cycles: 4,
  parameterBytes: 0,
  description: () => "CPL"
}

export const addToHL = (register: WordLocation): Instruction => {
  return {
    execute(cpu) {
      const hl = cpu.registers.HL
      const r = getWordRef(register, cpu)

      const hlValue = hl.value
      const rValue = r.value

      const result = hlValue + rValue

      hl.value = result & 0xFFFF

      const halfCarry = ((hlValue & 0x0FFF) + (rValue & 0x0FFF)) > 0xFFF

      cpu.registers.F.operation = false
      cpu.registers.F.halfCarry = halfCarry
      cpu.registers.F.carry = result > 0xFFFF
    },
    cycles: 8,
    parameterBytes: 0,
    description: () => `ADD HL,${register}`
  }
}

export const addImmediateToSP: Instruction = {
  execute(cpu) {
    const sp = cpu.registers.SP
    const amount = from2sComplement(cpu.nextByte.value)

    const oldValue = sp.value
    const newValue = oldValue + amount

    const halfCarry = (oldValue & 0xF) + (amount & 0xF) > 0xF
    const carry = (oldValue & 0xFF) + (amount & 0xFF) > 0xFF

    sp.value = newValue & 0xFFFF

    cpu.registers.F.zero = false
    cpu.registers.F.operation = false
    cpu.registers.F.halfCarry = halfCarry
    cpu.registers.F.carry = carry
  },
  cycles: 16,
  parameterBytes: 1,
  description: ([value]) => `ADD SP,${valueDisplay(value)}`
}

export const daa: Instruction = {
  execute(cpu) {
    const a = cpu.registers.A
    const flags = cpu.registers.F

    const value = a.value

    let correction = 0

    let setCarry = false
    if (flags.halfCarry || (!flags.operation && (value & 0xF) > 9)) {
      correction |= 0x6
    }
    if (flags.carry || (!flags.operation && value > 0x99)) {
      correction |= 0x60
      setCarry = true
    }

    const result = value + (flags.operation ? -correction : correction)

    a.value = result & 0xFF

    flags.carry = setCarry
    flags.halfCarry = false
    flags.zero = (result & 0xFF) == 0
  },
  cycles: 4,
  parameterBytes: 0,
  description: () => "DAA"
}