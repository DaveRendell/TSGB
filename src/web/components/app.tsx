import * as React from "react"
import { Cartridge } from "../../emulator/memory/cartridges/cartridge"
import GameView from "./gameView"
import { Emulator } from "../../emulator/emulator"
import GameLoader from "./gameLoader"

export default function App() {
  const [cartridge, setCartridge] = React.useState<Cartridge | null>(null)

  if (cartridge) {
    const emulator = new Emulator(cartridge)
    const paletteString = window.localStorage.getItem("monochromePalette")
    if (paletteString) {
      const palette = JSON.parse(paletteString)
      emulator.pictureProcessor.colours = palette
    }
    return <GameView emulator={emulator} unload={() => setCartridge(null)} />
  }

  return <GameLoader setCartridge={setCartridge} />
}