import * as React from "react"
import { StoredGame } from "../indexedDb/storedGame"

interface Props {
  game: StoredGame
  playGame: () => void
  openOptions: () => void
}

export default function LibraryCard({ game, playGame, openOptions }: Props) {
  const play = async () => {}

  return (
    <article key={game.id} className="library-card">
      <h3>{game.title}</h3>
      <button onClick={playGame}>Play</button>
      <button onClick={openOptions}>Options</button>
    </article>
  )
}
