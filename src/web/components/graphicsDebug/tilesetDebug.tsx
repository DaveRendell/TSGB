import * as React from "react"
import { VRAM } from "../../../emulator/memory/vram"
import { EmulatorMode } from "../../../emulator/emulator"

interface Props {
  vram: VRAM
  mode: EmulatorMode
}

export function TilesetDebug({ vram, mode }: Props) {
  return <div>
    <h3>Tileset</h3>
  </div>
}