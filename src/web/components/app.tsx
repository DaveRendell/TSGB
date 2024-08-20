import * as React from "react"
import { Cartridge } from "../../emulator/memory/cartridges/cartridge"
import GameView from "./gameView"
import { Emulator, EmulatorMode } from "../../emulator/emulator"
import GameLoader from "./gameLoader"
import { DebugMap } from "../../emulator/debug/types"

export default function App() {
  const [cartridge, setCartridge] = React.useState<Cartridge | null>(null)
  const [mode, setMode] = React.useState<EmulatorMode | null>(null)
  const [colouriseDmg, setColouriseDmg] = React.useState(false)
  const [debugMap, setDebugMap] = React.useState<DebugMap | undefined>(undefined)

  if (cartridge && mode !== null) {
    const emulator = new Emulator(cartridge, mode, colouriseDmg, debugMap)
    const paletteString = window.localStorage.getItem("monochromePalette")
    if (paletteString) {
      const palette = JSON.parse(paletteString)
      emulator.pictureProcessor.scanlineRenderer.colours = palette
    }
    return <>
      <h1>TSGB</h1>
      <GameView emulator={emulator} unload={
        () => {
            setCartridge(null)
            setDebugMap(null)
          }
        } 
        />
    </>
  }

  return <>
    <h1>TSGB</h1>
    <GameLoader
      setCartridge={setCartridge}
      setMode={setMode}
      setColouriseDmg={setColouriseDmg}
      setDebugMap={setDebugMap}
    />
  </>
}
