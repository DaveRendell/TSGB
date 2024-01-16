import * as React from "react"
import { StoredGame } from "../indexedDb/storedGame"
import { deleteGame, persistSave, updateGame } from "../indexedDb/gameStore"

interface Props {
  game: StoredGame
  playGame: () => void
  closeOptions: () => void
}

export default function GameOptions({ game, playGame, closeOptions }: Props) {
  const [name, setName] = React.useState(game.title)

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

  const updateBoxArt = async (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault()
    if (e.target.files && e.target.files[0]) {
      game.boxart = e.target.files[0]
      await updateGame(game)
    }
  }

  const updateName = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    game.title = name
    await updateGame(game)
  }

  return (
    <section>
      <h2>{game.title}</h2>
      <button onClick={playGame}>Play</button>
      <br />
      <form onSubmit={updateName}>
        <input
          type="text"
          id="name-update"
          onChange={e => {e.preventDefault(); setName(e.target.value)}}
          value={name}
        />
        <input
          type="submit"
          value="Update name"
        />
      </form>
      <button onClick={downloadSave}>Export Save</button>
      <br />
      <label htmlFor="save-import">Import save</label>
      <input id="save-import" type="file" onChange={importSave} />
      <br />
      <label htmlFor="set-boxart">Set boxart</label>
      <input id="set-boxart" type="file" onChange={updateBoxArt} />
      <br />
      <button onClick={() => deleteGame(game.id)}>Delete</button>
      <br />
      <button onClick={closeOptions}>Back</button>
    </section>
  )
}
