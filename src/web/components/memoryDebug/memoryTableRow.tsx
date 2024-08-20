import * as React from "react"
import Memory from "../../../emulator/memory/memoryMap"
import { addressDisplay, valueDisplay } from "../../../helpers/displayHexNumbers"
import { from2sComplement } from "../../../emulator/cpu/instructions/instructionHelpers"
import {
  Instruction,
  decodeInstruction,
} from "../../../emulator/cpu/instructions/instruction"
import { Emulator } from "../../../emulator/emulator"
import findSection from "../../../emulator/debug/findSection"

interface Props {
  address: number
  emulator: Emulator
  toggle: () => void,
  isFirstRow: boolean,
  key: number
}

export default function MemoryTableRow({
  address,
  emulator,
  toggle,
  isFirstRow,
}: Props) {
  const memory = emulator.memory
  const programCounter = emulator.cpu.registers.PC.word
  const breakpoints = emulator.cpu.breakpoints
  const memoryLocation = memory.at(address)
  const [value, setValue] = React.useState(0)
  const [inputValue, setInputValue] = React.useState("")

  const updateDisplay = () => {
    setValue(memoryLocation.byte)
    toggle()
    if (memoryLocation && memoryLocation.byte) {
      setInputValue(valueDisplay(memoryLocation.byte))
    }
  }

  React.useEffect(updateDisplay, [memoryLocation.byte, programCounter])

  const update = () => {
    memoryLocation.byte = parseInt(inputValue)
    updateDisplay()
  }

  const toggleBreakpoint = () => {
    if (breakpoints.has(address)) {
      breakpoints.delete(address)
    } else {
      breakpoints.add(address)
    }
    toggle()
  }

  let instructionDescription: string
  let isUnknown: boolean

  const getInstructionAt = (
    memoryLocation: number,
  ): Instruction | undefined => {
    try {
      const code = memory.at(memoryLocation).byte
      return decodeInstruction(memory.cpu, code, memory.at(memoryLocation + 1).byte)
    } catch {
      return undefined
    }
  }

  try {
    const instruction = decodeInstruction(memory.cpu, value, memory.at(address + 1).byte)
    const parameters = new Array(instruction.parameterBytes)
      .fill(0)
      .map((_, i) => memory.at(address + 1 + i).byte)
    instructionDescription = instruction.description(parameters)
    isUnknown = false
  } catch (e) {
    instructionDescription = "???"
    const instructionMinusOne = getInstructionAt((address - 1) & 0xffff)
    const instructionMinusTwo = getInstructionAt((address - 2) & 0xffff)
    isUnknown =
      (!instructionMinusOne || instructionMinusOne.parameterBytes < 1) &&
      (!instructionMinusTwo || instructionMinusTwo.parameterBytes < 2)
  }

  const rowRegion = memory.getRegion(address)

  const region = `${rowRegion.name.toUpperCase()}:${rowRegion.bank}`

  let sectionString = ""
  let symbolString = ""
  if (emulator.debugMap) {
    const section = findSection(emulator.debugMap, address, memory)
    if (section) {
      sectionString =
        isFirstRow 
          ? section.start === address
            ? section.name
            : `${section.name}+${address - section.start}`
          : section.start === address
            ? section.name
            : ""
      
      const symbol = section.symbols.find(symbol => symbol.address === address)
      if (symbol) {
        symbolString = symbol.name
      }
    }
  }

  return (
    <tr>
      <td>{programCounter === address ? "PC ->" : ""}</td>
      <td>
        <input
          type="checkbox"
          checked={breakpoints.has(address)}
          onChange={toggleBreakpoint}
        />
      </td>
      <td>
        {region}
      </td>
      <td>
        <code>{addressDisplay(address)}</code>
      </td>
      <td>
        <code>{valueDisplay(value)}</code>
      </td>
      <td>
        <code>{isUnknown ? "ERROR?" : instructionDescription}</code>
      </td>
      <td>
        {sectionString}
      </td>
      <td>
        {symbolString}
      </td>
    </tr>
  )
}
