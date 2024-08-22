import * as React from "react"
import GameView from "./gameView"
import { Emulator } from "../../emulator/emulator"
import GameLoader from "./gameLoader"

export default function App() {
  const [emulator, setEmulator] = React.useState<Emulator | undefined>(undefined)

  if (emulator) {
    
    return <>
      <h1>TSGB</h1>
      <GameView emulator={emulator} unload={() => setEmulator(undefined)} />
    </>
  }

  return <>
    <h1>TSGB</h1>
    <GameLoader setEmulator={setEmulator} />
  </>
}
