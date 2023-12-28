import * as React from "react"
import Memory from "../../emulator/memory"
import useLocalFile from "../hooks/useLocalFile"
import { Cartridge } from "../../emulator/memory/cartridges/cartridge"
import { createCartridge } from "../../emulator/memory/cartridges/createCartridge"

interface Props {
  setCartridge: (cartridge: Cartridge) => void
}

export default function GameLoader({ setCartridge }: Props) {
  const [gameFile, setGameFile] = useLocalFile("game.gb")


  const handleGameUpload = async function(e: React.ChangeEvent<HTMLInputElement>) {
    e.preventDefault()
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      setGameFile(file)
      if (gameFile) {
        setCartridge(await createCartridge(gameFile))
      }   
    }
  }

  const loadGame = async () => {
    if (gameFile) {
      setCartridge(await createCartridge(gameFile))
    }    
  }

  return (<section>
    <h2>Game Loader</h2>
    <label htmlFor="bios-load">Game: </label>
    {
      gameFile
        ? <>Loaded <button onClick={() => setGameFile(null)}>clear?</button></>
        : <input
            id="game-load"
            type="file"
            onChange={handleGameUpload}
          />
    }
    <br/>
    { gameFile && <button onClick={() => loadGame()}>Run</button>}
  </section>)
}