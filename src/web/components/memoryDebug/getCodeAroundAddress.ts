import { decodeInstruction } from "../../../emulator/cpu/instructions/instruction";
import { Section } from "../../../emulator/debug/types";
import { Emulator } from "../../../emulator/emulator";

interface Line {
  address: number,
  bytes: number[],
  asCode: string,
  section?: Section,
  symbol?: Symbol,
}

/**
 * Returns the region of memory around a given address,
 * parsed as assembly code as much as possible. 
 */
export default function getCodeAroundAddress(
  address: number,
  emulator: Emulator,
  linesAbove: number,
  linesBelow: number,
): Line[] {
  const startLine = getLine(address, emulator)
  const lines: Line[] = [startLine]

  let current = startLine
  let cursor = address + current.bytes.length

  while (lines.length <= linesBelow) {
    current = getLine(cursor, emulator)
    lines.push(current)
    cursor += current.bytes.length
  }

  return lines
}

/*
  A - non params
  B - one param

  A C - > previous command is A?
  B A C -> Oh no, it's B
  B B A C -> Oh, actually it was A...
  B B B A C -> Oh god there's no way of knowing...
*/

function getLine(
  address: number,
  emulator: Emulator,
): Line {
  const value = emulator.memory.at(address).byte
  const nextValue = emulator.memory.at((address + 1) & 0xFFFF).byte
  const instruction = decodeInstruction(emulator.cpu, value, nextValue)

  const byteCount = instruction.parameterBytes + (value === 0xCB ? 2 : 1)
  const bytes = [...new Array(byteCount)]
    .map((_, i) => emulator.memory.at(address + i).byte)
  const parameters = bytes.slice(value === 0xCB ? 2 : 1) 
  const asCode = instruction.description(parameters)

  return {
    address,
    bytes,
    asCode
  }
}
