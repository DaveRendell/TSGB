import * as React from "react"
import { Emulator, EmulatorMode } from "../../../emulator/emulator"
import { ColourStyle } from "../../../emulator/memory/registers/paletteRegisters"
import { AudioControl } from "./audioControl"
import { MonochromePalettePicker } from "./monochromePalettePicker"
import { ColourGradingControl } from "./colourGradingControl"
import { ScalingOptions } from "./scalingOptions"
import KeyboardMapping from "./keyboardMapping"
import GamepadMapping from "./gamepadMapping"
import { ColourisationPalettes } from "./colourisationPalettes"

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
      { emulator.mode !== EmulatorMode.CGB &&
        <MonochromePalettePicker pictureProcessor={emulator.pictureProcessor} />
      }
      { emulator.colouriseDmg &&
        <ColourisationPalettes emulator={emulator} />
      }
      { (emulator.mode !== EmulatorMode.DMG || emulator.colouriseDmg) &&
        <ColourGradingControl registers={emulator.memory.registers} />
      }
      <ScalingOptions />
      <KeyboardMapping emulator={emulator} />
      <GamepadMapping emulator={emulator} />
    </section>
  )
}
