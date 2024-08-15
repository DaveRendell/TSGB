import * as React from "react"
import { Emulator } from "../../../emulator/emulator"
import { TilesetDebug } from "./tilesetDebug"
import { BackgroundDebug } from "./backgroundDebug"
import { WindowDebug } from "./windowDebug"
import { SpriteDebug } from "./spriteDebug"
import { PaletteDebug } from "./paletteDebug"

interface Props {
  emulator: Emulator
}

type GraphicsDebugTab =
  "Tileset"
  | "Background"
  | "Window"
  | "Sprites"
  | "Palettes"


export function GraphicsDebug({ emulator }: Props) {
  const [tab, setTab] = React.useState<GraphicsDebugTab>("Tileset")

  const getTab = () => {
    switch(tab) {
      case "Tileset":
        return <TilesetDebug vram={emulator.memory.vram} mode={emulator.mode} />
      case "Background":
        return <BackgroundDebug emulator={emulator} />
      case "Window":
        return <WindowDebug emulator={emulator} />
      case "Sprites":
        return <SpriteDebug emulator={emulator} />
      case "Palettes":
        return <PaletteDebug
          registers={emulator.memory.registers}
          mode={emulator.mode}
          colours={emulator.pictureProcessor.scanlineRenderer.colours}
          colouriseDmg={emulator.colouriseDmg}
        />
    }
  }
  
  return (<section>
    <h2>Graphics debug</h2>
    <select value={tab.toString()} onChange={e => setTab(e.target.value as GraphicsDebugTab)}>
      <option id="Tileset">Tileset</option>
      <option id="Background">Background</option>
      <option id="Window">Window</option>
      <option id="Sprites">Sprites</option>
      <option id="Palettes">Palettes</option>
    </select>
    { getTab() }
  </section>)
}