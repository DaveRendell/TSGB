import * as React from "react"
import { Emulator } from "../../../emulator/emulator"
import getCodeAroundAddress, { Line } from "./getCodeAroundAddress"
import { addressDisplay } from "../../../helpers/displayHexNumbers"
import "./codeDisplay.css"
import { updateGame } from "../../indexedDb/gameStore"
import FocusControl from "./focusControl"
import { describePointer } from "../../../emulator/cpu/instructions/instructionHelpers"
import findSymbol from "../../../emulator/debug/findSymbol"

interface Props {
  linesAbove: number,
  linesBelow: number,
  emulator: Emulator,
}

export default function CodeDisplay({ linesAbove, linesBelow, emulator }: Props) {
  const [focus, setFocus] = React.useState(emulator.cpu.registers.PC.word)

  const lines = getCodeAroundAddress(focus, emulator, linesAbove, linesBelow)

  const nextAddress = lines[lines.findIndex(line => line.address == focus) + 1].address
  const previousAddress = lines[lines.findIndex(line => line.address == focus) - 1].address
  
  const breakpoints = emulator.cpu.breakpoints
  const toggleBreakpoint = (line: Line) => {
    if (breakpoints.has(line.address)) {
      if (emulator.storedGame.breakpoints) {
        emulator.storedGame.breakpoints = emulator.storedGame.breakpoints
          .filter(([_bank, address]) => address !== line.address)
        updateGame(emulator.storedGame)
      }
      breakpoints.delete(line.address)
    } else {
      breakpoints.add(line.address)
      if (emulator.storedGame.breakpoints) {
        emulator.storedGame.breakpoints.push([0, line.address])
      } else {
        emulator.storedGame.breakpoints = [[0, line.address]]
      }
      updateGame(emulator.storedGame)
    }
  }

  const rowClass = (line: Line) => emulator.cpu.registers.PC.word === line.address
    ? "pc-line"
    : emulator.cpu.breakpoints.has(line.address)
      ? "breakpoint-line"
      : line.address === focus
        ? "focus-line"
        : ""

  const breakpointClass = (line: Line) =>
    emulator.cpu.breakpoints.has(line.address)
      ? "breakpoint breakpoint-active"
      : "breakpoint"

  return <div className="code-panel">
      <FocusControl
        focus={focus}
        nextAddress={nextAddress}
        previousAddress={previousAddress}
        setFocus={setFocus}
        pc={emulator.cpu.registers.PC.word}
      />
      <pre className="code-display">
        { 
          lines.map(line => {
            const symbol = findSymbol(emulator.debugMap, line.address, emulator.memory)
            
            return <div className={rowClass(line)} key={line.address}>
              { (symbol.address === line.address) &&
                <div>{fitToWidth(symbol.name + "::", 52)}</div>
              }
              <span className={breakpointClass(line)}>
                <input type="checkbox"
                  checked={breakpoints.has(line.address)}
                  onChange={() => toggleBreakpoint(line)}
                />
              </span>
              {formatLine(line)}
            </div>
          })
        }
      </pre>
  </div>
}

const formatLine = (line: Line): string =>
  `$${line.address.toString(16).padStart(4, "0")}  ` // 7 char
  + fitToWidth(line.asCode, 40)
  + "  " + line.bytes.map(byte => byte.toString(16).padStart(2, "0")).join(" ").padEnd(8, " ")

const fitToWidth = (input: string, length: number): string => {
  if (input.length <= length) {
    return input.padEnd(length, " ")
  }

  return input.slice(0, length - 3) + "..."
}