import * as React from "react"
import { Cartridge } from "../../emulator/memory/cartridges/cartridge"
import GameView from "./gameView"
import { Emulator, EmulatorMode } from "../../emulator/emulator"
import GameLoader from "./gameLoader"

export default function App() {
  const [cartridge, setCartridge] = React.useState<Cartridge | null>(null)
  const [mode, setMode] = React.useState<EmulatorMode | null>(null)
  const [colouriseDmg, setColouriseDmg] = React.useState(false)

  if (cartridge && mode !== null) {
    const emulator = new Emulator(cartridge, mode, colouriseDmg)
    const paletteString = window.localStorage.getItem("monochromePalette")
    if (paletteString) {
      const palette = JSON.parse(paletteString)
      emulator.pictureProcessor.scanlineRenderer.colours = palette
    }
    return <>
      <h1>TSGB</h1>
      <GameView emulator={emulator} unload={() => setCartridge(null)} />
    </>
  }

  return <>
    <h1>TSGB</h1>
    <GameLoader
      setCartridge={setCartridge}
      setMode={setMode}
      setColouriseDmg={setColouriseDmg}
    />
  </>
}
