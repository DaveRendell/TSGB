import * as React from "react"
import { Emulator } from "../../../emulator/emulator"
import describeAddress from "./describeAddress"

interface Props {
  emulator: Emulator
}

export default function Registers({ emulator }: Props) {
  const internalRegisters = [
    ["AF", emulator.cpu.registers.AF.word],
    ["BC", emulator.cpu.registers.BC.word],
    ["DE", emulator.cpu.registers.DE.word],
    ["HL", emulator.cpu.registers.HL.word],
    ["PC", emulator.cpu.registers.PC.word],
    ["SP", emulator.cpu.registers.SP.word],
  ] as const

  const displayValue = (value: number) =>
    "0x" + value.toString(16).padStart(4, "0")
  return <div>
    <h3>Registers</h3>
    <table>
      <tbody>
        {internalRegisters.map(([name, value]) =>
          <tr><td>{name}</td><td>{displayValue(value)}</td><td>({describeAddress(value, emulator)})</td></tr>)}
      </tbody>
    </table>
  </div>
}