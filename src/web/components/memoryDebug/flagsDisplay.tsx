import * as React from "react"
import { Flags } from "../../../emulator/cpu/flags"
import useAnimationFrame from "../../hooks/useAnimationFrame"

interface Props {
  flagsRegister: Flags
}

export default function FlagsDisplay({ flagsRegister }: Props) {
  const currentValue = {
    zero: flagsRegister.zero,
    operation: flagsRegister.operation,
    halfCarry: flagsRegister.halfCarry,
    carry: flagsRegister.carry,
  }

  return <div>
    <h3>Flags</h3>
    <table>
      <tbody>
        <tr>
          <td>Zero</td>
          <td><input
            type="checkbox"
            checked={currentValue.zero}
            disabled
          /></td>
        </tr>
        <tr>
          <td>Operation</td>
          <td><input
            type="checkbox"
            checked={currentValue.operation}
            disabled
          /></td>
        </tr>
        <tr>
          <td>Half Carry</td>
          <td><input
            type="checkbox"
            checked={currentValue.halfCarry}
            disabled
          /></td>
        </tr>
        <tr>
          <td>Carry</td>
          <td><input
            type="checkbox"
            checked={currentValue.carry}
            disabled
          /></td>
        </tr>
      </tbody>
    </table>
  </div>
}