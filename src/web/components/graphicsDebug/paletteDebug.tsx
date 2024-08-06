import * as React from "react"
import { IoRegisters } from "../../../emulator/memory/registers/ioRegisters"
import { EmulatorMode } from "../../../emulator/emulator"
import { PaletteDisplay } from "./paletteDisplay"

interface Props {
  registers: IoRegisters
  mode: EmulatorMode
  colours: number[][]
}

export function PaletteDebug({ registers, mode, colours }: Props) {
  if (mode !== EmulatorMode.CGB) {
    return <div>
      <h3>Palettes</h3>
      <table>
        <tbody>
          <tr>
            <td>Background</td>
            <td><PaletteDisplay colours={registers.backgroundPallete.map.map(c => colours[c])} /></td>
          </tr>
          <tr>
            <td>Object 0</td>
            <td><PaletteDisplay colours={registers.objectPallete0.map.map(c => colours[c])} /></td>
          </tr>
          <tr>
            <td>Object 1</td>
            <td><PaletteDisplay colours={registers.objectPallete1.map.map(c => colours[c])} /></td>
          </tr>
        </tbody>
      </table>
    </div>
  }

  return <div>
      <h3>Palettes</h3>
      <h4>Background Palettes</h4>
      <table>
        <tbody>
          {registers.backgroundPalettes.scaledColours.map((palette, i) => <tr>
            <td>Background {i}</td>
            <td><PaletteDisplay colours={palette} values={registers.backgroundPalettes.rawColours[i]}/></td>
          </tr>)}
        </tbody>
      </table>
      <h4>Object Palettes</h4>
      <table>
        <tbody>
          {registers.objectPalettes.scaledColours.map((palette, i) => <tr>
            <td>Object {i}</td>
            <td><PaletteDisplay colours={palette} values={registers.objectPalettes.rawColours[i]}/></td>
          </tr>)}
        </tbody>
      </table>
    </div>
}