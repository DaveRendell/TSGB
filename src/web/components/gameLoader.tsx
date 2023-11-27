import * as React from "react"
import Memory from "../../emulator/memory"

interface Props {
  memory: Memory
}

export default function GameLoader({ memory }: Props) {
  const handleBiosUpload = function(e: React.ChangeEvent<HTMLInputElement>) {
    e.preventDefault()
    if (e.target.files && e.target.files[0]) {
      const a = e.target.files[0]
      memory.loadBios(e.target.files[0])
    }
  }
  const handleGameUpload = function(e: React.ChangeEvent<HTMLInputElement>) {
    e.preventDefault()
  }
  return (<section>
    <h2>Game Loader</h2>
    <label htmlFor="bios-load">BIOS (optional)</label>
    <input
      id="bios-load"
      type="file"
      onChange={handleBiosUpload}
    />
    
    <label htmlFor="bios-load">Game</label>
    <input
      id="game-load"
      type="file"
      onChange={handleGameUpload}
    />

  </section>)
}