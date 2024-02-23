import { valueDisplay } from "../../../helpers/displayHexNumbers"
import { AluOperation } from "../../../types"
import CPU from "../cpu"
import { Instruction } from "./instruction"
import {
  ByteLocation,
  WordLocation,
  describeByteLocation,
  describeWordLocation,
  from2sComplement,
  getByteRef,
  getWordRef,
} from "./instructionHelpers"

const splitToNibbles = (value: number) => [(value >> 4) & 0xf, value & 0xf]
const combineNibbles = (h: number, l: number) => (h << 4) + l

const OPERATIONS: Record<AluOperation, (cpu: CPU, value: number) => void> = {
  ADD: (cpu, value) => {
    const a = cpu.registers.A
    const [h, l] = splitToNibbles(value)
    const [hA, lA] = splitToNibbles(a.byte)

    const hR = h + hA
    const lR = l + lA
    const r = combineNibbles(hR, lR)
    const rWrapped = r & 0xff

    a.byte = rWrapped

    cpu.registers.F.zero = rWrapped == 0
    cpu.registers.F.operation = false
    cpu.registers.F.halfCarry = lR > 0xf
    cpu.registers.F.carry = rWrapped != r
  },
  ADC: (cpu, value) => {
    const a = cpu.registers.A
    const carry = cpu.registers.F.carry ? 1 : 0
    const [h, l] = splitToNibbles(value)
    const [hA, lA] = splitToNibbles(a.byte)

    const hR = h + hA
    const lR = l + lA + carry
    const r = combineNibbles(hR, lR)
    const rWrapped = r & 0xff

    a.byte = rWrapped

    cpu.registers.F.zero = rWrapped == 0
    cpu.registers.F.operation = false
    cpu.registers.F.halfCarry = lR > 0xf
    cpu.registers.F.carry = rWrapped != r
  },
  SUB: (cpu, value) => {
    const a = cpu.registers.A
    const [h, l] = splitToNibbles(value)
    const [hA, lA] = splitToNibbles(a.byte)

    const hR = hA - h
    const lR = lA - l
    const r = combineNibbles(hR, lR)
    const rWrapped = r & 0xff

    a.byte = rWrapped

    cpu.registers.F.zero = rWrapped == 0
    cpu.registers.F.operation = true
    cpu.registers.F.halfCarry = lR < 0
    cpu.registers.F.carry = rWrapped != r
  },
  SBC: (cpu, value) => {
    const a = cpu.registers.A
    const carry = cpu.registers.F.carry ? 1 : 0
    const [h, l] = splitToNibbles(value)
    const [hA, lA] = splitToNibbles(a.byte)

    const hR = hA - h
    const lR = lA - l - carry
    const r = combineNibbles(hR, lR)
    const rWrapped = r & 0xff

    a.byte = rWrapped

    cpu.registers.F.zero = rWrapped == 0
    cpu.registers.F.operation = true
    cpu.registers.F.halfCarry = lR < 0
    cpu.registers.F.carry = rWrapped != r
  },
  AND: (cpu, value) => {
    const a = cpu.registers.A

    a.byte &= value

    cpu.registers.F.zero = a.byte === 0
    cpu.registers.F.operation = false
    cpu.registers.F.halfCarry = true
    cpu.registers.F.carry = false
  },
  XOR: (cpu, value) => {
    const a = cpu.registers.A

    a.byte ^= value

    cpu.registers.F.zero = a.byte === 0
    cpu.registers.F.operation = false
    cpu.registers.F.halfCarry = false
    cpu.registers.F.carry = false
  },
  OR: (cpu, value) => {
    const a = cpu.registers.A

    a.byte |= value

    cpu.registers.F.zero = a.byte === 0
    cpu.registers.F.operation = false
    cpu.registers.F.halfCarry = false
    cpu.registers.F.carry = false
  },
  CP: (cpu, value) => {
    const a = cpu.registers.A
    const [h, l] = splitToNibbles(value)
    const [hA, lA] = splitToNibbles(a.byte)

    const hR = hA - h
    const lR = lA - l
    const r = combineNibbles(hR, lR)
    const rWrapped = r & 0xff

    cpu.registers.F.zero = rWrapped == 0
    cpu.registers.F.operation = true
    cpu.registers.F.halfCarry = lR < 0
    cpu.registers.F.carry = rWrapped != r
  },
}

export function aluOperation(
  operation: AluOperation,
  sourceName: ByteLocation,
): Instruction {
  return {
    execute: (cpu) => {
      OPERATIONS[operation](cpu, getByteRef(sourceName, cpu).byte)
    },
    cycles: sourceName === ByteLocation.M ? 8 : 4,
    parameterBytes: 0,
    description: (v) => `${operation} A,${describeByteLocation(sourceName)(v)}`,
  }
}

export function aluOperationImmediate(operation: AluOperation): Instruction {
  return {
    execute: (cpu) => {
      const value = cpu.nextByte.byte
      OPERATIONS[operation](cpu, value)
    },
    cycles: 8,
    parameterBytes: 1,
    description: ([value]) => `${operation} A,${valueDisplay(value)}`,
  }
}

export function increment8Bit(targetName: ByteLocation): Instruction {
  return {
    execute: (cpu) => {
      const target = getByteRef(targetName, cpu)
      target.byte++

      cpu.registers.F.zero = target.byte == 0
      cpu.registers.F.operation = false
      cpu.registers.F.halfCarry = (target.byte & 0xf) === 0
    },
    cycles: targetName === ByteLocation.M ? 12 : 4,
    parameterBytes: 0,
    description: (v) => `INC ${describeByteLocation(targetName)(v)}`,
  }
}

export function decrement8Bit(targetName: ByteLocation): Instruction {
  return {
    execute: (cpu) => {
      const target = getByteRef(targetName, cpu)
      target.byte--

      cpu.registers.F.zero = target.byte == 0
      cpu.registers.F.operation = true
      cpu.registers.F.halfCarry = (target.byte & 0xf) === 0xf
    },
    cycles: targetName === ByteLocation.M ? 12 : 4,
    parameterBytes: 0,
    description: (v) => `DEC ${describeByteLocation(targetName)(v)}`,
  }
}

export function increment16Bit(register: WordLocation): Instruction {
  return {
    execute: (cpu) => {
      getWordRef(register, cpu).word++
    },
    cycles: 8,
    parameterBytes: 0,
    description: (v) => `INC ${describeWordLocation(register)(v)}`,
  }
}

export function decrement16Bit(register: WordLocation): Instruction {
  return {
    execute: (cpu) => {
      getWordRef(register, cpu).word--
    },
    cycles: 8,
    parameterBytes: 0,
    description: (v) => `DEC ${describeWordLocation(register)(v)}`,
  }
}

export function rotateLeft(
  registerName: ByteLocation,
  throughCarry: boolean,
  isPrefixed: boolean,
  setZero = true,
): Instruction {
  const commandName = throughCarry ? "RL" : "RLC"
  return {
    execute: (cpu) => {
      const register = getByteRef(registerName, cpu)
      const value = register.byte
      const wrap = throughCarry ? (cpu.registers.F.carry ? 1 : 0) : value >> 7
      const rotated = ((value << 1) & 0xff) + wrap
      register.byte = rotated

      cpu.registers.F.zero = setZero && rotated === 0
      cpu.registers.F.operation = false
      cpu.registers.F.halfCarry = false
      cpu.registers.F.carry = value >> 7 > 0
    },
    cycles: isPrefixed ? (registerName === ByteLocation.M ? 12 : 8) : 4,
    parameterBytes: 0,
    description: () => `${commandName} ${registerName}`,
  }
}

export function rotateRight(
  registerName: ByteLocation,
  throughCarry: boolean,
  isPrefixed: boolean,
  setZero = true,
): Instruction {
  const commandName = throughCarry ? "RR" : "RRC"
  return {
    execute: (cpu) => {
      const register = getByteRef(registerName, cpu)
      const value = register.byte
      const wrap = throughCarry ? (cpu.registers.F.carry ? 1 : 0) : value & 1
      const rotated = (value >> 1) + (wrap << 7)
      register.byte = rotated

      cpu.registers.F.zero = setZero && rotated === 0
      cpu.registers.F.operation = false
      cpu.registers.F.halfCarry = false
      cpu.registers.F.carry = (value & 1) > 0
    },
    cycles: isPrefixed ? (registerName === ByteLocation.M ? 12 : 8) : 4,
    parameterBytes: 0,
    description: () => `${commandName} ${registerName}`,
  }
}

export const cpl: Instruction = {
  execute: (cpu) => {
    cpu.registers.A.byte = ~cpu.registers.A.byte

    cpu.registers.F.operation = true
    cpu.registers.F.halfCarry = true
  },
  cycles: 4,
  parameterBytes: 0,
  description: () => "CPL",
}

export const addToHL = (register: WordLocation): Instruction => {
  return {
    execute(cpu) {
      const hl = cpu.registers.HL
      const r = getWordRef(register, cpu)

      const hlValue = hl.word
      const rValue = r.word

      const result = hlValue + rValue

      hl.word = result & 0xffff

      const halfCarry = (hlValue & 0x0fff) + (rValue & 0x0fff) > 0xfff

      cpu.registers.F.operation = false
      cpu.registers.F.halfCarry = halfCarry
      cpu.registers.F.carry = result > 0xffff
    },
    cycles: 8,
    parameterBytes: 0,
    description: () => `ADD HL,${register}`,
  }
}

export const addImmediateToSP: Instruction = {
  execute(cpu) {
    const sp = cpu.registers.SP
    const amount = from2sComplement(cpu.nextByte.byte)

    const oldValue = sp.word
    const newValue = oldValue + amount

    const halfCarry = (oldValue & 0xf) + (amount & 0xf) > 0xf
    const carry = (oldValue & 0xff) + (amount & 0xff) > 0xff

    sp.word = newValue & 0xffff

    cpu.registers.F.zero = false
    cpu.registers.F.operation = false
    cpu.registers.F.halfCarry = halfCarry
    cpu.registers.F.carry = carry
  },
  cycles: 16,
  parameterBytes: 1,
  description: ([value]) => `ADD SP,${valueDisplay(value)}`,
}

export const daa: Instruction = {
  execute(cpu) {
    const a = cpu.registers.A
    const flags = cpu.registers.F

    const value = a.byte

    let correction = 0

    let setCarry = false
    if (flags.halfCarry || (!flags.operation && (value & 0xf) > 9)) {
      correction |= 0x6
    }
    if (flags.carry || (!flags.operation && value > 0x99)) {
      correction |= 0x60
      setCarry = true
    }

    const result = value + (flags.operation ? -correction : correction)

    a.byte = result & 0xff

    flags.carry = setCarry
    flags.halfCarry = false
    flags.zero = (result & 0xff) == 0
  },
  cycles: 4,
  parameterBytes: 0,
  description: () => "DAA",
}
