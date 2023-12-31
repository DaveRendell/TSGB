import * as React from "react"
import { Cartridge } from "../../emulator/memory/cartridges/cartridge"
import GameView from "./gameView"
import { Emulator } from "../../emulator/emulator"
import GameLoader from "./gameLoader"

export default function App() {
  const [cartridge, setCartridge] = React.useState<Cartridge | null>(null)

  if (cartridge) {
    return <GameView emulator={new Emulator(cartridge)} unload={() => setCartridge(null)} />
  }

  return <GameLoader setCartridge={setCartridge} />
}