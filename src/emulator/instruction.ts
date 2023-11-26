import { valueDisplay } from "../helpers/displayHexNumbers";
import { AluOperation, JumpCondition, Target8Name } from "../types";
import CPU from "./cpu";
import { aluOperation, aluOperationImmediate, decrement8Bit, increment8Bit } from "./instructions/arithmetic8bit";
import halt from "./instructions/halt";
import { jumpRelative } from "./instructions/jumps";

import { loadBetweenLocations, loadImmediate8bitRegister, loadImmediateToMemory } from "./instructions/loads";
import nop from "./instructions/nop";

export interface Instruction {
  execute: (cpu: CPU) => void
  cycles: number
  parameterBytes: number
  description: (parameters: number[]) => string
}

const STATIC_INSTRUCTIONS: { [code: number]: Instruction } = {
  0x00: nop,
  0x76: halt,
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

export function decodeInstruction(code: number): Instruction {
  const staticInstruction = STATIC_INSTRUCTIONS[code]
  if (staticInstruction) { return staticInstruction }

  // decoded instructions to go here...
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

  throw new Error("Instruction not found for code " + valueDisplay(code))
}