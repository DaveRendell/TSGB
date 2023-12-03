import { valueDisplay } from "../helpers/displayHexNumbers";
import { AluOperation, JumpCondition, Register16Name, Target8Name } from "../types";
import CPU from "./cpu";
import InstructionNotFoundError from "./instructionNotFoundError";
import { addImmediateToSP, addToHL, aluOperation, aluOperationImmediate, cpl, daa, decrement16Bit, decrement8Bit, increment16Bit, increment8Bit, rotateLeft, rotateRight } from "./instructions/arithmetic8bit";
import { ccf, disableInterrupts, enableInterrupts, scf, stop } from "./instructions/cpuControl";
import halt from "./instructions/halt";
import { jpHl, jump, jumpRelative, rst } from "./instructions/jumps";

import { load8Bit, loadHlFromSpPlusN, loadImmediate16BitRegister, loadStackPointerFromHL, loadStackPointerToAddress } from "./instructions/loads";
import nop from "./instructions/nop";
import { resetBit, setBit, shiftLeftArithmetic, shiftRightArithmetic, shiftRightLogical, swap, testBit } from "./instructions/prefixInstructions";
import { call, callF, pop, push, ret, retF, reti } from "./instructions/stack";

export interface Instruction {
  execute: (cpu: CPU) => void
  cycles: number
  parameterBytes: number
  description: (parameters: number[]) => string
}

// Prefixed 0x80 = 10000000

const STATIC_INSTRUCTIONS: { [code: number]: Instruction } = {
  0x00: nop,
  0x08: loadStackPointerToAddress,
  0x76: halt,
  0x10: stop,
  0b00100010: load8Bit("M", "A", "increment"),
  0b00101010: load8Bit("A", "M", "increment"),
  0b00110010: load8Bit("M", "A", "decrement"),
  0b00111010: load8Bit("A", "M", "decrement"),
  0x07: rotateLeft("A", false, false, false),
  0x17: rotateLeft("A", true, false, false),
  0x0F: rotateRight("A", false, false, false),
  0x1F: rotateRight("A", true, false, false),
  0x18: jumpRelative("None"),
  0x2F: cpl,
  0x37: scf,
  0x3F: ccf,
  0xF0: load8Bit("A", "(FF,N)"),
  0xE0: load8Bit("(FF,N)", "A"),
  0xF2: load8Bit("A", "(FF,C)"),
  0xE2: load8Bit("(FF,C)", "A"),
  0xCD: call,
  0xE8: addImmediateToSP,
  0xC9: ret,
  0xD9: reti,
  0xC3: jump("None"),
  0xF8: loadHlFromSpPlusN,
  0x27: daa,
  0b11101010: load8Bit("(NN)", "A"),
  0b11111010: load8Bit("A", "(NN)"),
  0xE9: jpHl,
  0xF9: loadStackPointerFromHL,
  0xF3: disableInterrupts,
  0xFB: enableInterrupts,
}

const REGISTERS_8: Target8Name[] = [
  "B", "C", "D", "E", "H", "L", "M", "A"
]
const ALU_OPERATIONS: AluOperation[] = [
  "ADD", "ADC", "SUB", "SBC", "AND", "XOR", "OR", "CP"
]
const JUMP_CONDITION: JumpCondition[] = [
  "Not-Zero", "Zero", "Not-Carry", "Carry"
]
const REGISTER_16_COLUMN_1: ("(BC)" | "(DE)")[] = [
  "(BC)", "(DE)"
]
const REGISTER_16_COLUMN_2: Register16Name[] = [
  "BC", "DE", "HL", "SP"
]
const REGISTER_16_COLUMN_3: Register16Name[] = [
  "BC", "DE", "HL", "AF"
]


function getDestination(code: number): Target8Name {
  return REGISTERS_8[(code >> 3) & 0b111]
}
function getSource(code: number): Target8Name {
  return REGISTERS_8[code & 0b111]
}
function getOperation(code: number): AluOperation {
  return ALU_OPERATIONS[(code >> 3) & 0b111]
}
function getCondition(code: number): JumpCondition {
  return JUMP_CONDITION[(code >> 3) & 0b11]
}
function getRegisterColumn1(code: number): "(BC)" | "(DE)" {
  return REGISTER_16_COLUMN_1[(code >> 4) & 0b1]
}
function getRegisterColumn2(code: number): Register16Name {
  return REGISTER_16_COLUMN_2[(code >> 4) & 0b11]
}
function getRegisterColumn3(code: number): Register16Name {
  return REGISTER_16_COLUMN_3[(code >> 4) & 0b11]
}

export function decodeInstruction(code: number, prefixedCode?: number): Instruction {
  const staticInstruction = STATIC_INSTRUCTIONS[code]
  if (staticInstruction) {
    return staticInstruction
  }

  // decoded instructions to go here...
  if ((code & 0b11001111) === 0b00000001) { // LD RR,nn
    const register = getRegisterColumn2(code)
    return loadImmediate16BitRegister(register)
  }

  if((code & 0b11001111) === 0b00001001) { // ADD HL,RR
    const register = getRegisterColumn2(code)
    return addToHL(register)
  }

  if ((code & 0b11101111) == 0b00000010) { // LD (R),A
    return load8Bit(getRegisterColumn1(code), "A")
  }

  if ((code & 0b11101111) == 0b00001010) { // LD A,(R)
    return load8Bit("A", getRegisterColumn1(code))
  }

  if ((code & 0b11001111) === 0b00000011) {
    return increment16Bit(getRegisterColumn2(code))
  }

  if ((code & 0b11001111) === 0b00001011) {
    return decrement16Bit(getRegisterColumn2(code))
  }

  if ((code & 0b11000111) === 0b00000100) { // INC R
    const destination = getDestination(code)
    return increment8Bit(destination)
  }

  if ((code & 0b11000111) === 0b00000101) { // DEC R
    const destination = getDestination(code)
    return decrement8Bit(destination)
  }

  if ((code & 0b11100111) === 0b00100000) { // JR F
    const condition = getCondition(code)
    return jumpRelative(condition)
  }

  if ((code & 0b11000111) === 0b00000110) { // LD R,N
    return load8Bit(getDestination(code), "N")
  }

  if ((code & 0b11000000) === 0b01000000) { // LD R,R
    return load8Bit(getDestination(code), getSource(code))
  }

  if ((code & 0b11000000) === 0b10000000) { // ALU A,R
    const operation = getOperation(code)
    const source = getSource(code)
    return aluOperation(operation, source)
  }
  
  if ((code & 0b11000111) === 0b11000110) { // ALU A,N
    const operation = getOperation(code)
    return aluOperationImmediate(operation)
  }

  if ((code & 0b11001111) === 0b11000001) { // POP RR
    return pop(getRegisterColumn3(code))
  }

  if ((code & 0b11001111) === 0b11000101) { // PUSH RR
    return push(getRegisterColumn3(code))
  }

  if ((code & 0b11000111) === 0b11000111) { // RST N
    return rst(code &0b00111000)
  }

  if ((code & 0b11100111) === 0b11000000) { // RET F
    return retF(getCondition(code))
  }

  if ((code & 0b11100111) === 0b11000010) {
    return(jump(getCondition(code)))
  }

  if ((code & 0b11100111) == 0b11000100) { // CALL F,NN
    const condition = getCondition(code)
    return callF(condition)
  }

  if (code === 0xCB ) { // Prefixed instructions
    if (prefixedCode === undefined) {
      throw new Error("Prefix instruction missing")
    }
    if ((prefixedCode & 0b11111000) === 0b00000000) { // RLC D
      return rotateLeft(getSource(prefixedCode), false, true)
    }
    if ((prefixedCode & 0b11111000) === 0b00001000) { // RRC D
      return rotateRight(getSource(prefixedCode), false, true)
    }
    if ((prefixedCode & 0b11111000) === 0b00010000) { // RL D
      return rotateLeft(getSource(prefixedCode), true, true)
    }
    if ((prefixedCode & 0b11111000) === 0b00011000) { // RR D
      return rotateRight(getSource(prefixedCode), true, true)
    }
    if ((prefixedCode & 0b11111000) === 0b00100000) { // SLA D
      return shiftLeftArithmetic(getSource(prefixedCode))
    }
    if ((prefixedCode & 0b11111000) === 0b00101000) { // SRA D
      return shiftRightArithmetic(getSource(prefixedCode))
    }
    if ((prefixedCode & 0b11000000) === 0b01000000) { // BIT N,D
      const bit = (prefixedCode >> 3) & 0b111
      const source = getSource(prefixedCode)
      return testBit(bit, source)
    }
    if ((prefixedCode & 0b11000000) === 0b10000000) { // RES N,D
      const bit = (prefixedCode >> 3) & 0b111
      const source = getSource(prefixedCode)
      return resetBit(bit, source)
    }
    if ((prefixedCode & 0b11000000) === 0b11000000) { // SET N,D
      const bit = (prefixedCode >> 3) & 0b111
      const source = getSource(prefixedCode)
      return setBit(bit, source)
    }
    if ((prefixedCode & 0b11111000) === 0b00110000) { // SWAP D
      return swap(getSource(prefixedCode))
    }
    if ((prefixedCode & 0b11111000) === 0b00111000) { // SRL D
      return shiftRightLogical(getSource(prefixedCode))
    }
  }

  throw new InstructionNotFoundError(code)
}