import * as React from "react"
import { Emulator } from "../../../emulator/emulator"
import getCodeAroundAddress, { Line } from "./getCodeAroundAddress"
import { addressDisplay } from "../../../helpers/displayHexNumbers"
import "./codeDisplay.css"

interface Props {
  focus: number,
  linesAbove: number,
  linesBelow: number,
  emulator: Emulator,
}

export default function CodeDisplay({ focus, linesAbove, linesBelow, emulator }: Props) {
  const lines = getCodeAroundAddress(focus, emulator, linesAbove, linesBelow)

  
  const breakpoints = emulator.cpu.breakpoints
  const toggleBreakpoint = (line: Line) => {
    if (breakpoints.has(line.address)) {
      breakpoints.delete(line.address)
    } else {
      breakpoints.add(line.address)
    }
  }

  const rowClass = (line: Line) => emulator.cpu.registers.PC.word === line.address
    ? "pc-line"
    : emulator.cpu.breakpoints.has(line.address)
      ? "breakpoint-line"
      : ""

  const breakpointClass = (line: Line) =>
    emulator.cpu.breakpoints.has(line.address)
      ? "breakpoint breakpoint-active"
      : "breakpoint"

  return <table className="code-display">
    <tbody>
      {lines.map(line =>
        <tr className={rowClass(line)}>
          <td className={breakpointClass(line)}>
            <input type="checkbox"
              checked={breakpoints.has(line.address)}
              onChange={() => toggleBreakpoint(line)}
            />
          </td>
          <td><pre>{addressDisplay(line.address)}</pre></td>
          <td><pre>{line.asCode}</pre></td><br/>
          <td><pre>{line.bytes.map(byte => byte.toString(16).padStart(2, "0")).join(" ")}</pre></td>
        </tr>
      )}
    </tbody>
  </table>
}