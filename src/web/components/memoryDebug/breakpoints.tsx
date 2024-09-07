import * as React from "react"
import { addressDisplay } from "../../../helpers/displayHexNumbers"
import { Emulator } from "../../../emulator/emulator"
import { mutateGame } from "../../indexedDb/gameStore"

interface Props {
  emulator: Emulator
}

export default function Breakpoints({ emulator }: Props) {
  const [newBreakpointInput, setNewBreakpointInput] = React.useState("")

  const breakpoints = emulator.cpu.breakpoints

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

  return <div>
    <input
            className="narrow"
            value={newBreakpointInput}
            type="text"
            onChange={e => setNewBreakpointInput(e.target.value)}/>
          <button onClick={() => addBreakpoint(parseInt("0x" + newBreakpointInput))}>Add breakpoint</button>
    <ul>
      {[...breakpoints].map(address =>
        <li key={address}>
          {addressDisplay(address)} <button onClick={() => deleteBreakpoint(address)}>X</button>
        </li>)}
    </ul>
  </div>
}