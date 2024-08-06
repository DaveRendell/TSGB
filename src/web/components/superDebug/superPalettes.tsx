import * as React from "react"
import SuperEmulator from "../../../emulator/super/superEmulator"
import { PaletteDisplay } from "../graphicsDebug/paletteDisplay"

interface Props {
  superEmulator: SuperEmulator
}

export default function SuperPalettes({ superEmulator }: Props) {
  return <>
    <table>
      <tbody>
        {superEmulator.palettes.map((palette, i) => <tr>
          <td>Palette {i}</td>
          <td><PaletteDisplay
            colours={palette.colours}
            values={palette.colours.map(colour => colour.map(scaled => scaled >> 3))}/></td>
        </tr>)}
      </tbody>
    </table>
  </>
}