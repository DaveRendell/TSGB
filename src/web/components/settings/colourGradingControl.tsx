import * as React from "react"
import { IoRegisters } from "../../../emulator/memory/registers/ioRegisters"
import { ColourStyle } from "../../../emulator/memory/registers/paletteRegisters"

interface Props {
  registers: IoRegisters
}

export function ColourGradingControl({ registers }: Props) {
  const [colourGrading, setColourGrading] = React.useState(registers.backgroundPalettes.colourStyle)

  const pickColourGrading =  (grading: ColourStyle) => (e: React.ChangeEvent<HTMLInputElement>) => {
    // e.preventDefault()
    registers.backgroundPalettes.colourStyle = grading
    registers.objectPalettes.colourStyle = grading
    registers.backgroundPalettes.updateAllColours()
    registers.objectPalettes.updateAllColours()
    setColourGrading(grading)
  }

  return (
    <div>
      <h3>Colour grading</h3>
      Pick the colour grading to apply to colour games<br/>
      <input type="radio" id="cg_washed" name="colour_grading" value="WASHED" checked={colourGrading == ColourStyle.Washed} onChange={pickColourGrading(ColourStyle.Washed)} />
      <label htmlFor="cg_washed">Washed out (resembles appearance on LCD display)</label><br/>
      <input type="radio" id="cg_raw" name="colour_grading" value="RAW" checked={colourGrading == ColourStyle.Raw} onChange={pickColourGrading(ColourStyle.Raw)} />
      <label htmlFor="cg_raw">Raw colours</label><br/>
      <input type="radio" id="cg_vapourwave" name="colour_grading" value="RAW" checked={colourGrading == ColourStyle.Vapourwave} onChange={pickColourGrading(ColourStyle.Vapourwave)} />
      <label htmlFor="cg_vapourwave">Vapourwave</label><br/>
    </div>
  )
}