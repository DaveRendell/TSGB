import * as React from "react"
import Memory from "../../emulator/memory"
import { addressDisplay, valueDisplay } from "../../helpers/displayHexNumbers"
import { from2sComplement } from "../../emulator/instructions/instructionHelpers"
import { Instruction, decodeInstruction } from "../../emulator/instruction"

interface Props {
  address: number
  memory: Memory
  programCounter: number
  breakpoints: Set<number>
  toggle: () => void
  key: number
}

export default function MemoryTableRow({
  address, memory, programCounter, breakpoints, toggle
}: Props) {
  const memoryLocation = memory.at(address)
  const [value, setValue] = React.useState(0)
  const [inputValue, setInputValue] = React.useState("")


  const updateDisplay = () => {
    setValue(memoryLocation.value)
    toggle()
    setInputValue(valueDisplay(memoryLocation.value))
  }

  React.useEffect(updateDisplay, [memoryLocation.value, programCounter])

  const update = () => {
    memoryLocation.value = parseInt(inputValue)
    updateDisplay()
  }

  const toggleBreakpoint = () => {
    if (breakpoints.has(address)) { breakpoints.delete(address) }
    else { breakpoints.add(address) }
    toggle()
  }

  let instructionDescription: string
  let isUnknown: boolean

  const getInstructionAt = (memoryLocation: number): Instruction | undefined => {
    try {
      const code = memory.at(memoryLocation).value
      return decodeInstruction(code, memory.at(memoryLocation + 1).value)
    } catch { return undefined }
  }

  try {
    const instruction = decodeInstruction(value, memory.at(address + 1).value)
    const parameters = new Array(instruction.parameterBytes)
      .fill(0)
      .map((_, i) => memory.at(address + 1 + i).value)
    instructionDescription = instruction.description(parameters)
    isUnknown = false
  } catch (e) {
    instructionDescription = "???"
    const instructionMinusOne = getInstructionAt((address - 1) & 0xFFFF)
    const instructionMinusTwo = getInstructionAt((address - 2) & 0xFFFF)
    isUnknown =
      (!instructionMinusOne || instructionMinusOne.parameterBytes < 1)
      && (!instructionMinusTwo || instructionMinusTwo.parameterBytes < 2)
  }

  return (
    <tr>
      <td>{programCounter === address ? "PC ->" : ""}</td>
      <td><input type="checkbox" checked={breakpoints.has(address)} onChange={toggleBreakpoint}/></td>
      <td><code>{addressDisplay(address)}</code></td>
      <td><code>{valueDisplay(value)}</code></td>
      <td>{value}</td>
      <td><code>{value.toString(2).padStart(8, "0")}</code></td>
      <td>{from2sComplement(value)}</td>
      <td><code>{isUnknown ? "ERROR?" : instructionDescription}</code></td>
      <td>
        <input
          className="narrow"
          type="text"
          value={inputValue}
          onChange={e => setInputValue(e.target.value)}
        />
      </td>
      <td><button onClick={update}>Update</button></td>
    </tr>
  )
}