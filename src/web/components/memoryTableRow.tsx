import * as React from "react"
import Memory from "../../emulator/memory/memoryMap"
import { addressDisplay, valueDisplay } from "../../helpers/displayHexNumbers"
import { from2sComplement } from "../../emulator/cpu/instructions/instructionHelpers"
import {
  Instruction,
  decodeInstruction,
} from "../../emulator/cpu/instructions/instruction"

interface Props {
  address: number
  memory: Memory
  programCounter: number
  breakpoints: Set<number>
  toggle: () => void
  key: number
}

export default function MemoryTableRow({
  address,
  memory,
  programCounter,
  breakpoints,
  toggle,
}: Props) {
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
        <code>{addressDisplay(address)}</code>
      </td>
      <td>
        <code>{valueDisplay(value || -1)}</code>
      </td>
      <td>{value}</td>
      <td>
        <code>{value?.toString(2).padStart(8, "0")}</code>
      </td>
      <td>{from2sComplement(value || -1)}</td>
      <td>
        <code>{isUnknown ? "ERROR?" : instructionDescription}</code>
      </td>
      <td>
        <input
          className="narrow"
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
        />
      </td>
      <td>
        <button onClick={update}>Update</button>
      </td>
    </tr>
  )
}
