import * as React from "react"
import { Emulator, EmulatorMode } from "../../../emulator/emulator"
import { ColourStyle } from "../../../emulator/memory/registers/paletteRegisters"
import { AudioControl } from "./audioControl"
import { MonochromePalettePicker } from "./monochromePalettePicker"
import { ColourGradingControl } from "./colourGradingControl"

interface Props {
  emulator: Emulator
}

export default function Settings({ emulator }: Props) {
  const [colourGrading, setColourGrading] = React.useState(emulator.memory.registers.backgroundPalettes.colourStyle)

  const pickColourGrading =  (grading: ColourStyle) => (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault()
    emulator.memory.registers.backgroundPalettes.colourStyle = grading
    emulator.memory.registers.objectPalettes.colourStyle = grading
    emulator.memory.registers.backgroundPalettes.updateAllColours()
    emulator.memory.registers.objectPalettes.updateAllColours()
    setColourGrading(grading)
  }

  return (
    <section>
      <h2>Settings</h2>
      <AudioControl audioProcessor={emulator.audioProcessor} />
      { emulator.mode === EmulatorMode.DMG &&
        <MonochromePalettePicker pictureProcessor={emulator.pictureProcessor} />
      }
      { emulator.mode !== EmulatorMode.DMG &&
        <ColourGradingControl registers={emulator.memory.registers} />
      }
    </section>
  )
}
