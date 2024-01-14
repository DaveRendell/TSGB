import { AluOperation, JumpCondition } from "../../../types"
import CPU from "../cpu"
import InstructionNotFoundError from "./instructionNotFoundError"
import {
  addImmediateToSP,
  addToHL,
  aluOperation,
  aluOperationImmediate,
  cpl,
  daa,
  decrement16Bit,
  decrement8Bit,
  increment16Bit,
  increment8Bit,
  rotateLeft,
  rotateRight,
} from "./arithmetic8bit"
import {
  ccf,
  disableInterrupts,
  enableInterrupts,
  scf,
  stop,
} from "./cpuControl"
import halt from "./halt"
import { ByteLocation, WordLocation } from "./instructionHelpers"
import { jpHl, jump, jumpRelative, rst } from "./jumps"

import {
  load8Bit,
  loadHlFromSpPlusN,
  loadImmediate16BitRegister,
  loadStackPointerFromHL,
  loadStackPointerToAddress,
} from "./loads"
import nop from "./nop"
import {
  resetBit,
  setBit,
  shiftLeftArithmetic,
  shiftRightArithmetic,
  shiftRightLogical,
  swap,
  testBit,
} from "./prefixInstructions"
import { call, callF, pop, push, ret, retF, reti } from "./stack"

export interface Instruction {
  execute: (cpu: CPU) => void
  cycles: number
  parameterBytes: number
  description: (parameters: number[]) => string
}

// Prefixed 0x80 = 10000000



const REGISTERS_8: ByteLocation[] = [
  ByteLocation.B,
  ByteLocation.C,
  ByteLocation.D,
  ByteLocation.E,
  ByteLocation.H,
  ByteLocation.L,
  ByteLocation.M,
  ByteLocation.A,
]
const ALU_OPERATIONS: AluOperation[] = [
  "ADD",
  "ADC",
  "SUB",
  "SBC",
  "AND",
  "XOR",
  "OR",
  "CP",
]
const JUMP_CONDITION: JumpCondition[] = [
  "Not-Zero",
  "Zero",
  "Not-Carry",
  "Carry",
]
const REGISTER_16_COLUMN_1: ByteLocation[] = [ByteLocation.BC, ByteLocation.DE]
const REGISTER_16_COLUMN_2: WordLocation[] = [
  WordLocation.BC,
  WordLocation.DE,
  WordLocation.HL,
  WordLocation.SP,
]
const REGISTER_16_COLUMN_3: WordLocation[] = [
  WordLocation.BC,
  WordLocation.DE,
  WordLocation.HL,
  WordLocation.AF,
]

function getDestination(code: number): ByteLocation {
  return REGISTERS_8[(code >> 3) & 0b111]
}
function getSource(code: number): ByteLocation {
  return REGISTERS_8[code & 0b111]
}
function getOperation(code: number): AluOperation {
  return ALU_OPERATIONS[(code >> 3) & 0b111]
}
function getCondition(code: number): JumpCondition {
  return JUMP_CONDITION[(code >> 3) & 0b11]
}
function getRegisterColumn1(code: number): ByteLocation {
  return REGISTER_16_COLUMN_1[(code >> 4) & 0b1]
}
function getRegisterColumn2(code: number): WordLocation {
  return REGISTER_16_COLUMN_2[(code >> 4) & 0b11]
}
function getRegisterColumn3(code: number): WordLocation {
  return REGISTER_16_COLUMN_3[(code >> 4) & 0b11]
}

export function decodeInstruction(
  cpu: CPU,
  code: number,
  prefixedCode?: number,
): Instruction {
  const STATIC_INSTRUCTIONS: { [code: number]: Instruction } = {
    0x00: nop,
    0x08: loadStackPointerToAddress,
    0x76: halt,
    0x10: stop,
    0b00100010: load8Bit(cpu, ByteLocation.M, ByteLocation.A, "increment"),
    0b00101010: load8Bit(cpu, ByteLocation.A, ByteLocation.M, "increment"),
    0b00110010: load8Bit(cpu, ByteLocation.M, ByteLocation.A, "decrement"),
    0b00111010: load8Bit(cpu, ByteLocation.A, ByteLocation.M, "decrement"),
    0x07: rotateLeft(ByteLocation.A, false, false, false),
    0x17: rotateLeft(ByteLocation.A, true, false, false),
    0x0f: rotateRight(ByteLocation.A, false, false, false),
    0x1f: rotateRight(ByteLocation.A, true, false, false),
    0x18: jumpRelative("None"),
    0x2f: cpl,
    0x37: scf,
    0x3f: ccf,
    0xf0: load8Bit(cpu, ByteLocation.A, ByteLocation.FF_N),
    0xe0: load8Bit(cpu, ByteLocation.FF_N, ByteLocation.A),
    0xf2: load8Bit(cpu, ByteLocation.A, ByteLocation.FF_C),
    0xe2: load8Bit(cpu, ByteLocation.FF_C, ByteLocation.A),
    0xcd: call,
    0xe8: addImmediateToSP,
    0xc9: ret,
    0xd9: reti,
    0xc3: jump("None"),
    0xf8: loadHlFromSpPlusN,
    0x27: daa,
    0b11101010: load8Bit(cpu, ByteLocation.NN, ByteLocation.A),
    0b11111010: load8Bit(cpu, ByteLocation.A, ByteLocation.NN),
    0xe9: jpHl,
    0xf9: loadStackPointerFromHL,
    0xf3: disableInterrupts,
    0xfb: enableInterrupts,
  }

  const staticInstruction = STATIC_INSTRUCTIONS[code]
  if (staticInstruction) {
    return staticInstruction
  }

  // decoded instructions to go here...
  if ((code & 0b11001111) === 0b00000001) {
    // LD RR,nn
    const register = getRegisterColumn2(code)
    return loadImmediate16BitRegister(register)
  }

  if ((code & 0b11001111) === 0b00001001) {
    // ADD HL,RR
    const register = getRegisterColumn2(code)
    return addToHL(register)
  }

  if ((code & 0b11101111) == 0b00000010) {
    // LD (R),A
    return load8Bit(cpu, getRegisterColumn1(code), ByteLocation.A)
  }

  if ((code & 0b11101111) == 0b00001010) {
    // LD A,(R)
    return load8Bit(cpu, ByteLocation.A, getRegisterColumn1(code))
  }

  if ((code & 0b11001111) === 0b00000011) {
    return increment16Bit(getRegisterColumn2(code))
  }

  if ((code & 0b11001111) === 0b00001011) {
    return decrement16Bit(getRegisterColumn2(code))
  }

  if ((code & 0b11000111) === 0b00000100) {
    // INC R
    const destination = getDestination(code)
    return increment8Bit(destination)
  }

  if ((code & 0b11000111) === 0b00000101) {
    // DEC R
    const destination = getDestination(code)
    return decrement8Bit(destination)
  }

  if ((code & 0b11100111) === 0b00100000) {
    // JR F
    const condition = getCondition(code)
    return jumpRelative(condition)
  }

  if ((code & 0b11000111) === 0b00000110) {
    // LD R,N
    return load8Bit(cpu, getDestination(code), ByteLocation.N)
  }

  if ((code & 0b11000000) === 0b01000000) {
    // LD R,R
    return load8Bit(cpu, getDestination(code), getSource(code))
  }

  if ((code & 0b11000000) === 0b10000000) {
    // ALU A,R
    const operation = getOperation(code)
    const source = getSource(code)
    return aluOperation(operation, source)
  }

  if ((code & 0b11000111) === 0b11000110) {
    // ALU A,N
    const operation = getOperation(code)
    return aluOperationImmediate(operation)
  }

  if ((code & 0b11001111) === 0b11000001) {
    // POP RR
    return pop(getRegisterColumn3(code))
  }

  if ((code & 0b11001111) === 0b11000101) {
    // PUSH RR
    return push(getRegisterColumn3(code))
  }

  if ((code & 0b11000111) === 0b11000111) {
    // RST N
    return rst(code & 0b00111000)
  }

  if ((code & 0b11100111) === 0b11000000) {
    // RET F
    return retF(getCondition(code))
  }

  if ((code & 0b11100111) === 0b11000010) {
    return jump(getCondition(code))
  }

  if ((code & 0b11100111) == 0b11000100) {
    // CALL F,NN
    const condition = getCondition(code)
    return callF(condition)
  }

  if (code === 0xcb) {
    // Prefixed instructions
    if (prefixedCode === undefined) {
      throw new Error("Prefix instruction missing")
    }
    if ((prefixedCode & 0b11111000) === 0b00000000) {
      // RLC D
      return rotateLeft(getSource(prefixedCode), false, true)
    }
    if ((prefixedCode & 0b11111000) === 0b00001000) {
      // RRC D
      return rotateRight(getSource(prefixedCode), false, true)
    }
    if ((prefixedCode & 0b11111000) === 0b00010000) {
      // RL D
      return rotateLeft(getSource(prefixedCode), true, true)
    }
    if ((prefixedCode & 0b11111000) === 0b00011000) {
      // RR D
      return rotateRight(getSource(prefixedCode), true, true)
    }
    if ((prefixedCode & 0b11111000) === 0b00100000) {
      // SLA D
      return shiftLeftArithmetic(getSource(prefixedCode))
    }
    if ((prefixedCode & 0b11111000) === 0b00101000) {
      // SRA D
      return shiftRightArithmetic(getSource(prefixedCode))
    }
    if ((prefixedCode & 0b11000000) === 0b01000000) {
      // BIT N,D
      const bit = (prefixedCode >> 3) & 0b111
      const source = getSource(prefixedCode)
      return testBit(bit, source)
    }
    if ((prefixedCode & 0b11000000) === 0b10000000) {
      // RES N,D
      const bit = (prefixedCode >> 3) & 0b111
      const source = getSource(prefixedCode)
      return resetBit(bit, source)
    }
    if ((prefixedCode & 0b11000000) === 0b11000000) {
      // SET N,D
      const bit = (prefixedCode >> 3) & 0b111
      const source = getSource(prefixedCode)
      return setBit(bit, source)
    }
    if ((prefixedCode & 0b11111000) === 0b00110000) {
      // SWAP D
      return swap(getSource(prefixedCode))
    }
    if ((prefixedCode & 0b11111000) === 0b00111000) {
      // SRL D
      return shiftRightLogical(getSource(prefixedCode))
    }
  }

  throw new InstructionNotFoundError(code)
}
