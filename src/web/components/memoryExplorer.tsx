import * as React from "react"
import Memory from "../../emulator/memory/memoryMap"
import { addressDisplay } from "../../helpers/displayHexNumbers"
import MemoryTableRow from "./memoryTableRow"
import { cpuUsage } from "process"

interface Props {
  memory: Memory
  programCounter: number
  breakpoints: Set<number>
}

export default function MemoryExplorer({
  memory,
  programCounter,
  breakpoints,
}: Props) {
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
    memory.cpu.breakpoints.add(address)
  }

  const addresses = Array.from({ length }, (_, i) => baseAddress + i)

  return (
    <section>
      <h2>Memory Explorer</h2>
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
      <br/>
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
            <th>Address</th>
            <th>Hex</th>
            <th>Dec</th>
            <th>Binary</th>
            <th>Signed</th>
            <th>Command</th>
            <th>Update</th>
          </tr>
        </thead>
        <tbody>
          {addresses.map((address) => (
            <MemoryTableRow
              key={address}
              address={address}
              memory={memory}
              programCounter={programCounter}
              breakpoints={breakpoints}
              toggle={() => setToggle(!toggle)}
            />
          ))}
        </tbody>
      </table>
    </section>
  )
}
