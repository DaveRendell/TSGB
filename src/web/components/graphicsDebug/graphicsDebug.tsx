import * as React from "react"
import { Emulator } from "../../../emulator/emulator"
import { TilesetDebug } from "./tilesetDebug"
import { BackgroundDebug } from "./backgroundDebug"

interface Props {
  emulator: Emulator
}

type GraphicsDebugTab =
  "Tileset"
  | "Background"


export function GraphicsDebug({ emulator }: Props) {
  const [tab, setTab] = React.useState<GraphicsDebugTab>("Tileset")

  const getTab = () => {
    switch(tab) {
      case "Tileset":
        return <TilesetDebug vram={emulator.memory.vram} mode={emulator.mode} />
      case "Background":
        return <BackgroundDebug emulator={emulator} />
    }
  }
  
  return (<section>
    <h2>Graphics debug</h2>
    <select value={tab.toString()} onChange={e => setTab(e.target.value as GraphicsDebugTab)}>
      <option id="Tileset">Tileset</option>
      <option id="Background">Background</option>
    </select>
    { getTab() }
  </section>)
}