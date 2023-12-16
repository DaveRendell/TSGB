import * as React from "react"
import Memory from "../../emulator/memory"
import useLocalFile from "../hooks/useLocalFile"

interface Props {
  memory: Memory
}

export default function GameLoader({ memory }: Props) {
  const [biosFile, setBiosFile] = useLocalFile("bios.bin")
  const [gameFile, setGameFile] = useLocalFile("game.gb")
  const [gameTitle, setGameTitle] = React.useState("EMPTY")
  const [saveFile, setSaveFile] = useLocalFile(gameTitle + ".sav")

  React.useEffect(() => {
    if (gameFile) {
      memory.loadGame(gameFile).then(
        () => setGameTitle(memory.cartridge.title))
    }
    if (biosFile) { memory.loadBootRom(biosFile) }
  }, [
    biosFile === null ? 0 : biosFile.size,
    gameFile === null ? 0 : gameFile.size,
  ])

  React.useEffect(() => {
    if (gameTitle !== "EMPTY") {
      memory.cartridge.storeRam = (data) => {
        console.log("SAVIIIING?")
        const blob = new Blob([data])
        const file = new File([blob], gameTitle + ".sav", { type: 'application/octet-stream' })
        setSaveFile(file)
      }      
    }
  }, [gameTitle])

  React.useEffect(() => {
    if (saveFile) {
      memory.cartridge.loadRam(saveFile)
    }
  }, [
    saveFile === null ? 0 : saveFile.size
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
    <label htmlFor="bios-load">BIOS (optional): </label>
    {
      biosFile
        ? <>Loaded <button onClick={() => setBiosFile(null)}>clear?</button></>
        : <input
            id="bios-load"
            type="file"
            onChange={handleBiosUpload}
          />
    }
    <br/>    
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
  </section>)
}