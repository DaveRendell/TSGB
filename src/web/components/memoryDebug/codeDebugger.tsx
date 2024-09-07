import * as React from "react"
import { addressDisplay } from "../../../helpers/displayHexNumbers"
import { Emulator } from "../../../emulator/emulator"
import Stack from "./stack"
import Registers from "./registers"
import FlagsDisplay from "./flagsDisplay"
import Interrupts from "./interrupts"
import CodeDisplay from "./codeDisplay"
import CpuController from "../cpuController"
import { mutateGame, updateGame } from "../../indexedDb/gameStore"

interface Props {
  emulator: Emulator
}

export default function CodeDebugger({ emulator }: Props) {
  const breakpoints = emulator.cpu.breakpoints

  const [newBreakpointInput, setNewBreakpointInput] = React.useState("")

  // Enable breakpoints when this tab is open
  React.useEffect(() => {
    emulator.cpu.debuggingEnabled = true
    console.log("Setting debuggingEnabled", emulator.cpu.debuggingEnabled)
    return () => {
      emulator.cpu.debuggingEnabled = false
      console.log("Disabling debuggingEnabled", emulator.cpu.debuggingEnabled)
    }
  }, [emulator])

  const addBreakpoint = (address: number): void => {
    emulator.storedGame.breakpoints
      ? emulator.storedGame.breakpoints.push([0, address])
      : emulator.storedGame.breakpoints = [[0, address]]
    mutateGame(
      emulator.storedGame.id,
      (game) => game.breakpoints = emulator.storedGame.breakpoints
    )
    emulator.cpu.breakpoints.add(address)
  }

  const deleteBreakpoint = (address: number): void => {
    emulator.storedGame.breakpoints
      ? emulator.storedGame.breakpoints =
        emulator.storedGame.breakpoints.filter(([_bank, breakpointAddress]) => address !== breakpointAddress)
      : []
      mutateGame(
        emulator.storedGame.id,
        (game) => game.breakpoints = emulator.storedGame.breakpoints
      )
      emulator.cpu.breakpoints.delete(address)
  }

  if (emulator.cpu.running) {
    return <section>
      Pause emulation to debug game code
    </section>
  }

  return (
    <section>
      <h2>Code debugger</h2>
      <div className="flex-horizontally">
        <CodeDisplay
          emulator={emulator}
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
                  <li key={address}>
                    {addressDisplay(address)} <button onClick={() => deleteBreakpoint(address)}>X</button>
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
