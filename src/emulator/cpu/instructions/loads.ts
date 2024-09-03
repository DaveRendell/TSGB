import {
  addressDisplay,
  valueDisplay,
} from "../../../helpers/displayHexNumbers"
import { Instruction } from "./instruction"
import { WordRef } from "../../refs/wordRef"
import {
  combineBytes,
  getByteRef,
  from2sComplement,
  ByteLocation,
  describeByteLocation,
  getWordRef,
  describeWordLocation,
  WordLocation,
  describePointer,
  describePointerFromBytes,
} from "./instructionHelpers"
import CPU from "../cpu"

const cycleCost = (location: ByteLocation): number => {
  switch (location) {
    case ByteLocation.N:
      return 4
    case ByteLocation.M:
      return 4
    case ByteLocation.FF_N:
      return 8
    case ByteLocation.FF_C:
      return 4
    case ByteLocation.BC:
      return 4
    case ByteLocation.DE:
      return 4
    case ByteLocation.NN:
      return 12
  }
  return 0
}

const getParameterBytes = (location: ByteLocation): number => {
  switch (location) {
    case ByteLocation.N:
      return 1
    case ByteLocation.FF_N:
      return 1
    case ByteLocation.NN:
      return 2
  }
  return 0
}

const commandName = (hlRegisterAction: "none" | "increment" | "decrement") =>
  hlRegisterAction === "increment"
    ? "ldi"
    : hlRegisterAction === "decrement"
      ? "ldd"
      : "ld"

const getPointerAction = (
  hlRegisterAction: "none" | "increment" | "decrement",
) =>
  hlRegisterAction === "increment"
    ? (hl: WordRef) => hl.word++
    : hlRegisterAction === "decrement"
      ? (hl: WordRef) => hl.word--
      : () => {}

export function load8Bit(
  cpu: CPU,
  destinationName: ByteLocation,
  sourceName: ByteLocation,
  hlRegisterAction: "none" | "increment" | "decrement" = "none",
): Instruction {
  const cycles = 4 + cycleCost(destinationName) + cycleCost(sourceName)

  const parameterBytes =
    getParameterBytes(sourceName) + getParameterBytes(destinationName)
  const length = 1 + parameterBytes

  const pointerAction = getPointerAction(hlRegisterAction)

  const destination = getByteRef(destinationName, cpu)
  const source = getByteRef(sourceName, cpu)

  return {
    execute: (cpu) => {
      destination.byte = source.byte

      pointerAction(cpu.registers.HL)
    },
    cycles,
    parameterBytes,
    description: (values) =>
      ``,
    length,
    toCode(bytes, emulator) {
      return `${commandName(hlRegisterAction)} ${describeByteLocation(destinationName, emulator)(bytes.slice(1))} ${describeByteLocation(sourceName, emulator)(bytes.slice(1))}`
    }
  }
}

export function loadImmediate16BitRegister(
  register: WordLocation,
): Instruction {
  return {
    execute: (cpu) => {
      const value = cpu.nextWord.word
      getWordRef(register, cpu).word = value
    },
    cycles: 12,
    parameterBytes: 2,
    description: ([l, h]) =>
      `LD ${describeWordLocation(register)([])},${addressDisplay(
        combineBytes(h, l),
      )}`,
    length: 3,
    toCode(bytes, emulator) {
      return `ld ${describeWordLocation(register)([])}, ${describePointerFromBytes(bytes, emulator)}`
    }
  }
}

export const loadHlFromSpPlusN: Instruction = {
  execute(cpu) {
    const increment = from2sComplement(cpu.nextByte.byte)
    const sp = cpu.registers.SP.word
    const result = sp + increment

    const halfCarry = (sp & 0xf) + (increment & 0xf) !== (result & 0xf)
    const carry = (sp & 0xff) + (increment & 0xff) !== (result & 0xff)

    cpu.registers.HL.word = result

    cpu.registers.F.zero = false
    cpu.registers.F.operation = false
    cpu.registers.F.halfCarry = halfCarry
    cpu.registers.F.carry = carry
  },
  cycles: 12,
  parameterBytes: 1,
  description: ([value]) => `LD HL,SP+${from2sComplement(value)}`,
  length: 2,
  toCode(bytes) {
    const offset = from2sComplement(bytes[1])
    const sign = offset >= 0 ? "+" : "-"
    return `ld hl, sp ${sign} ${offset}`
  },
}

export const loadStackPointerToAddress: Instruction = {
  execute(cpu) {
    const address = cpu.nextWord.word
    cpu.memory.wordAt(address).word = cpu.registers.SP.word
  },
  cycles: 20,
  parameterBytes: 2,
  description: ([l, h]) => `LD (${addressDisplay(combineBytes(h, l))}),SP`,
  length: 3,
  toCode(bytes, emulator) {
    return `ld [${describePointerFromBytes(bytes, emulator)}], sp`
  },
}

export const loadStackPointerFromHL: Instruction = {
  execute(cpu) {
    cpu.registers.SP.word = cpu.registers.HL.word
  },
  cycles: 8,
  parameterBytes: 0,
  description: () => "LD SP,HL",
  length: 1,
  toCode() {
    return "ld sp, hl"
  }
}
