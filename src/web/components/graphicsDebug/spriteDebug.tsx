import * as React from "react"
import { Emulator } from "../../../emulator/emulator"
import { SpriteInfo } from "./spriteInfo"

interface Props {
  emulator: Emulator
}

export function SpriteDebug({ emulator }: Props) {
  return (
    <div>
      <h3>Sprite debug</h3>
      Object Size: {emulator.memory.registers.lcdControl.objectSize}<br/>
      Enabled: {emulator.memory.registers.lcdControl.enabled ? "True" : "False"}<br/>
      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>Sprite</th>
            <th>Tile ID</th>
            <th>X</th>
            <th>Y</th>
            <th>Priority</th>
            <th>Flip X</th>
            <th>Flip Y</th>
            <th>Palette</th>
          </tr>
        </thead>
        <tbody>
          {emulator.memory.oam.sprites.map((sprite, i) => <SpriteInfo
            sprite={sprite}
            index={i}
            spriteSize={emulator.memory.registers.lcdControl.objectSize}
            mode={emulator.mode}
            palettes={emulator.memory.registers.objectPalettes}
            colours={emulator.pictureProcessor.scanlineRenderer.colours}
          />)}
        </tbody>
      </table>
    </div>
  )
}