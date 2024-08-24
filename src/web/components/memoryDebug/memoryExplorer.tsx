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
      <h2>Memory Explorer</h2>
      
      <div className="flex-horizontally">
        <div>
          Showing{" "}
          <input
            className="narrow"
            type="number"
            value={lengthInput}
            onChange={(e) => setLengthInput(parseInt(e.target.value))}
          />{" "}
          values starting at address{" "}
          <input
            className="narrow"
            value={baseAddressInput}
            type="text"
            onChange={(e) => setBaseAddressInput(e.target.value)}
          />{" "}
          <button onClick={update}>Update</button>
          <br />
          <button onClick={() => setBaseAddress(Math.max(programCounter - 4, 0))}>
            Jump to PC
          </button>
          <table className="memory-table">
            <thead>
              <tr>
                <th></th>
                <th>Break</th>
                <th>Region</th>
                <th>Address</th>
                <th>Hex</th>
                <th>Command</th>
                <th>Section</th>
                <th>Symbol</th>
              </tr>
            </thead>
            <tbody>
              {addresses.map((address, i) => (
                <MemoryTableRow
                  key={address}
                  address={address}
                  emulator={emulator}
                  toggle={() => setToggle(!toggle)}
                  isFirstRow={i === 0}
                />
              ))}
            </tbody>
          </table>
        </div>
        
        <div>
        <Stack emulator={emulator} />
        <Registers emulator={emulator} />
        <div className="flex-horizontally">
          <FlagsDisplay flagsRegister={emulator.cpu.registers.F} />
          <Interrupts emulator={emulator} />
        </div>
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
      <CodeDisplay
        emulator={emulator}
        focus={emulator.cpu.registers.PC.word}
        linesAbove={10}
        linesBelow={20}
      />
    </section>
  )
}
