import * as React from "react"
import Memory from "../../../emulator/memory/memoryMap"
import { addressDisplay } from "../../../helpers/displayHexNumbers"
import MemoryTableRow from "./memoryTableRow"
import { Emulator } from "../../../emulator/emulator"
import Stack from "./stack"
import Registers from "./registers"
import FlagsDisplay from "./flagsDisplay"
import Interrupts from "./interrupts"
import CodeDisplay from "./codeDisplay"
import CpuController from "../cpuController"
interface Props {
  emulator: Emulator
}

export default function MemoryExplorer({ emulator }: Props) {
  const memory = emulator.memory
  const programCounter = emulator.cpu.registers.PC.word
  const breakpoints = emulator.cpu.breakpoints

  const [toggle, setToggle] = React.useState(false)
  const [baseAddress, setBaseAddress] = React.useState(0x0000)
  const [length, setLength] = React.useState(25)

  const [baseAddressInput, setBaseAddressInput] = React.useState(
    addressDisplay(baseAddress),
  )
  const [lengthInput, setLengthInput] = React.useState(length)

  const [newBreakpointInput, setNewBreakpointInput] = React.useState("")

  const update = () => {
    setLength(lengthInput)
    setBaseAddress(parseInt(baseAddressInput))
  }

  const addBreakpoint = (address: number): void => {
    emulator.cpu.breakpoints.add(address)
  }

  const addresses = Array.from({ length }, (_, i) => baseAddress + i)

  return (
    <section>
      <h2>Memory</h2>
      <div className="flex-horizontally">
        <CodeDisplay
          emulator={emulator}
          focus={emulator.cpu.registers.PC.word}
          linesAbove={10}
          linesBelow={20}
        />
        <div>
          <CpuController cpu={emulator.cpu} />
          <Stack emulator={emulator} />
          <Registers emulator={emulator} />
          <FlagsDisplay flagsRegister={emulator.cpu.registers.F} />
          <Interrupts emulator={emulator} />
          { breakpoints.size > 0 && <p>
              Breakpoints:
              <ul>
                {[...breakpoints].map(address =>
                  <li>
                    <a onClick={() => setBaseAddress(Math.max(0, address - 4))}>{addressDisplay(address)} <button onClick={() => memory.cpu.breakpoints.delete(address)}>X</button></a>
                  </li>)}
              </ul>
            </p>}
          <input
            className="narrow"
            value={newBreakpointInput}
            type="text"
            onChange={e => setNewBreakpointInput(e.target.value)}/>
          <button onClick={() => addBreakpoint(parseInt("0x" + newBreakpointInput))}>Add breakpoint</button>
        </div>
      </div>
    </section>
  )
}
