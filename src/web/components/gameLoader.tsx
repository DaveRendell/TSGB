import * as React from "react"
import Memory from "../../emulator/memory"
import useLocalFile from "../hooks/useLocalFile"

interface Props {
  memory: Memory
}

export default function GameLoader({ memory }: Props) {
  const [biosFile, setBiosFile] = useLocalFile("bios.bin")
  const [gameFile, setGameFile] = useLocalFile("game.gb")

  React.useEffect(() => {
    if (biosFile) { memory.loadBios(biosFile) }
    if (gameFile) { memory.loadGame(gameFile) }
  }, [
    biosFile === null ? 0 : biosFile.size,
    gameFile === null ? 0 : gameFile.size,
  ])

  const handleBiosUpload = function(e: React.ChangeEvent<HTMLInputElement>) {
    e.preventDefault()
    if (e.target.files && e.target.files[0]) {
      setBiosFile(e.target.files[0])
    }
  }
  const handleGameUpload = function(e: React.ChangeEvent<HTMLInputElement>) {
    e.preventDefault()
    if (e.target.files && e.target.files[0]) {
      setGameFile(e.target.files[0])
    }
  }
  return (<section>
    <h2>Game Loader</h2>
    <label htmlFor="bios-load">BIOS (optional)</label>
    {
      biosFile
        ? <>Loaded <button onClick={() => setBiosFile(null)}>clear?</button></>
        : <input
            id="bios-load"
            type="file"
            onChange={handleBiosUpload}
          />
    }
    
    
    <label htmlFor="bios-load">Game</label>
    {
      gameFile
        ? <>Loaded <button onClick={() => setGameFile(null)}>clear?</button></>
        : <input
            id="game-load"
            type="file"
            onChange={handleGameUpload}
          />
    }
  </section>)
}