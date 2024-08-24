import * as React from "react"
import CPU from "../../emulator/cpu/cpu"
import { FlagName, Register16Name, Register8Name } from "../../types"
import { addressDisplay, valueDisplay } from "../../helpers/displayHexNumbers"

interface Props {
  cpu: CPU
}

const REGISTERS_8_BIT: Register8Name[] = [
  "A",
  "B",
  "C",
  "D",
  "E",
  "F",
  "H",
  "L",
]
const REGISTERS_16_BIT: Register16Name[] = ["HL", "PC", "SP", "BC", "DE", "AF"]
const FLAGS: string[] = ["zero", "operation", "halfCarry", "carry"]

export default function CpuController({ cpu }: Props) {
  return (
    <section>
      <button onClick={() => cpu.executeInstruction()}>
        Execute next instruction
      </button>
      <button onClick={() => cpu.run()}>Run</button>
      <button onClick={() => cpu.pause()}>Pause</button>
    </section>
  )
}
