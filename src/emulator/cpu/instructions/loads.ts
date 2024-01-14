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
    ? "LDI"
    : hlRegisterAction === "decrement"
      ? "LDD"
      : "LD"

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
      `${commandName(hlRegisterAction)} ${describeByteLocation(destinationName)(
        values,
      )},${describeByteLocation(sourceName)(values)}`,
  }
}

export function loadImmediate16BitRegister(
  register: WordLocation,
): Instruction {
  return {
    execute: (cpu) => {
      getWordRef(register, cpu).word = cpu.nextWord.word
    },
    cycles: 12,
    parameterBytes: 2,
    description: ([l, h]) =>
      `LD ${describeWordLocation(register)([])},${addressDisplay(
        combineBytes(h, l),
      )}`,
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
  description: ([value]) => `LD HL,SP+${valueDisplay(value)}`,
}

export const loadStackPointerToAddress: Instruction = {
  execute(cpu) {
    const address = cpu.nextWord.word
    cpu.memory.wordAt(address).word = cpu.registers.SP.word
  },
  cycles: 20,
  parameterBytes: 2,
  description: ([l, h]) => `LD (${addressDisplay(combineBytes(h, l))}),SP`,
}

export const loadStackPointerFromHL: Instruction = {
  execute(cpu) {
    cpu.registers.SP.word = cpu.registers.HL.word
  },
  cycles: 8,
  parameterBytes: 0,
  description: () => "LD SP,HL",
}
