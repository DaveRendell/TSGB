import * as React from "react"
import { StoredGame } from "../indexedDb/storedGame"
import { deleteGame } from "../indexedDb/gameStore"

interface Props {
  game: StoredGame
  playGame: () => void
  closeOptions: () => void
}

export default function GameOptions({ game, playGame, closeOptions }: Props) {
  return <section>
    <h2>{game.title}</h2>
    <button onClick={playGame}>Play</button>
    <br/>
    <button onClick={() => deleteGame(game.id)}>Delete</button>
    <br/>
    <button onClick={closeOptions}>Back</button>
  </section>
}