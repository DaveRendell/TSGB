import { decodeInstruction, Instruction } from "../../../emulator/cpu/instructions/instruction";
import { Section } from "../../../emulator/debug/types";
import { Emulator } from "../../../emulator/emulator";

export interface Line {
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

  const possibleLinesAbove = getPossibleLinesAbove(address, emulator, linesAbove)

  // Return the longest sequence of lines above found
  const previousLines = possibleLinesAbove.length === 0
    ? []
    : possibleLinesAbove.sort((a, b) => b.length - a.length)[0]
  return [...previousLines, ...lines]
}

function getLine(
  address: number,
  emulator: Emulator,
): Line {
  const value = emulator.memory.at(address).byte
  const nextValue = emulator.memory.at((address + 1) & 0xFFFF).byte
  let instruction: Instruction
  try {
    instruction = decodeInstruction(emulator.cpu, value, nextValue)
  } catch (e) {
    return {
      address,
      bytes: [value],
      asCode: ""
    }
  }
  

  const bytes = [...new Array(instruction.length)]
    .map((_, i) => emulator.memory.at(address + i).byte)
  
  const asCode = instruction.toCode(bytes, emulator, address)

  return {
    address,
    bytes,
    asCode
  }
}

/**
 * Finds possible list of instructions above an address. Impossible to verify
 * for certain they're correct via static analysis, but hopefully gives a
 * fairly accurate result.
 */
function getPossibleLinesAbove(
  address: number,
  emulator: Emulator,
  lines: number
): Line[][] {
  // Break recursion
  if (lines === 0) { return [] }

  // Instructions have byte length 1, 2, or 3. Find which of the three bytes
  // preceding the address could be the previous isntruction
  const candidateLines: Line[] = ([1, 2, 3])
    .map(offset => {
      const previousAddress = address - offset
      const line = getLine(previousAddress, emulator)
      return { offset, line }
    })
    .filter(({ offset, line}) => line.bytes.length === offset)
    .map(({ line }) => line)

  // For each potential previous byte, recurse backwards to get previous lines
  return [...candidateLines.flatMap(line =>
    getPossibleLinesAbove(line.address, emulator, lines - 1)
      .map(previousLines =>
        [...previousLines, line]
      )
  ), ...candidateLines.map(line => [line])]
}
