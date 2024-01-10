import * as React from "react"
import { StoredGame } from "../indexedDb/storedGame"
import { deleteGame, persistSave } from "../indexedDb/gameStore"

interface Props {
  game: StoredGame
  playGame: () => void
  closeOptions: () => void
}

export default function GameOptions({ game, playGame, closeOptions }: Props) {
  const downloadSave = () => {
    if (game.save) {
      const link = document.createElement("a")
      const file = new File([game.save], game.title + ".sav")
      link.href = URL.createObjectURL(file)
      link.click()
    }
  }

  const importSave = async (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault()
    if (e.target.files && e.target.files[0]) {
      const data = new Uint8Array(await e.target.files[0].arrayBuffer())
      game.save = data
      await persistSave(game.id)(data)
    }
  }

  return (
    <section>
      <h2>{game.title}</h2>
      <button onClick={playGame}>Play</button>
      <br />
      <button onClick={downloadSave}>Export Save</button>
      <br />
      <label htmlFor="save-import">Import save</label>
      <input id="save-import" type="file" onChange={importSave} />
      <br />
      <button onClick={() => deleteGame(game.id)}>Delete</button>
      <br />
      <button onClick={closeOptions}>Back</button>
    </section>
  )
}
