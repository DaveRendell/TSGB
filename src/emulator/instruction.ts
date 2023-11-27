import { valueDisplay } from "../helpers/displayHexNumbers";
import { AluOperation, JumpCondition, Register16Name, Target8Name } from "../types";
import CPU from "./cpu";
import { aluOperation, aluOperationImmediate, decrement8Bit, increment8Bit } from "./instructions/arithmetic8bit";
import halt from "./instructions/halt";
import { jumpRelative } from "./instructions/jumps";

import { loadBetweenLocations, loadFrom16BitRegisterLocation, loadFromMemoryAtC, loadFromMemoryAtImmediate, loadFromMemoryDecrement, loadFromMemoryIncrement, loadImmediate16BitRegister, loadImmediate8bitRegister, loadImmediateToMemory, loadTo16BitRegisterLocation, loadToMemoryAtC, loadToMemoryAtImmediate, loadToMemoryDecrement, loadToMemoryIncrement } from "./instructions/loads";
import nop from "./instructions/nop";
import { testBit } from "./instructions/prefixInstructions";
import { call, ret } from "./instructions/stack";

export interface Instruction {
  execute: (cpu: CPU) => void
  cycles: number
  parameterBytes: number
  description: (parameters: number[]) => string
}

const STATIC_INSTRUCTIONS: { [code: number]: Instruction } = {
  0x00: nop,
  0x76: halt,
  0b00100010: loadToMemoryIncrement,
  0b00101010: loadFromMemoryIncrement,
  0b00110010: loadToMemoryDecrement,
  0b00111010: loadFromMemoryDecrement,
  0xF0: loadFromMemoryAtImmediate,
  0xE0: loadToMemoryAtImmediate,
  0xF2: loadFromMemoryAtC,
  0xE2: loadToMemoryAtC,
  0xCD: call,
  0xC9: ret,
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
const REGISTER_16_COLUMN_1: Register16Name[] = [
  "BC", "DE"
]
const REGISTER_16_COLUMN_2: Register16Name[] = [
  "BC", "DE", "HL", "SP"
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
function getRegisterColumn1(code: number): Register16Name {
  return REGISTER_16_COLUMN_1[(code >> 4) & 0b1]
}
function getRegisterColumn2(code: number): Register16Name {
  return REGISTER_16_COLUMN_2[(code >> 4) & 0b11]
}

export function decodeInstruction(code: number, prefixedCode?: number): Instruction {
  const staticInstruction = STATIC_INSTRUCTIONS[code]
  if (staticInstruction) {
    return staticInstruction
  }

  // decoded instructions to go here...
  // BIOS VRAM load TODO:
  // CALL and RET
  // PUSH and POP
  // ROTATE (through carry)
  // INC DE (and BC?)
  // 16 bit increment?
  if ((code & 0b11001111) === 0b00000001) { // LD RR,nn
    const register = getRegisterColumn2(code)
    return loadImmediate16BitRegister(register)
  }
  if ((code & 0b11101111) == 0b00000010) { // LD (R),A
    const register = getRegisterColumn1(code)
    return loadTo16BitRegisterLocation(register)
  }
  if ((code & 0b11101111) == 0b00001010) { // LD A,(R)
    const register = getRegisterColumn1(code)
    return loadFrom16BitRegisterLocation(register) 
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
    const destination = getDestination(code)
    if (destination === "M") { return loadImmediateToMemory }
    else { return loadImmediate8bitRegister(destination) }
  }

  if ((code & 0b11000000) === 0b01000000) { // LD R,R
    const destination = getDestination(code)
    const source = getSource(code)
    return loadBetweenLocations(destination, source) //0b01001000
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

  if (code === 0xCB ) { // Prefixed instructions
    if (!prefixedCode) {
      throw new Error("Prefix instruction missing")
    }
    if ((prefixedCode & 0b11000000) === 0b01000000) { // BIT N,D
      const bit = (prefixedCode >> 3) & 0b111
      const source = getSource(prefixedCode)
      return testBit(bit, source)
    }
  }

  throw new Error("Instruction not found for code " + valueDisplay(code))
}