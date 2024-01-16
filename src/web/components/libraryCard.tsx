import * as React from "react"
import { StoredGame } from "../indexedDb/storedGame"
import "../library.css"

interface Props {
  game: StoredGame
  playGame: () => void
  openOptions: () => void
}

export default function LibraryCard({ game, playGame, openOptions }: Props) {
  return (
    <article key={game.id} className="library-card floating-panel">
      {game.boxart
        ? <img src={URL.createObjectURL(game.boxart)}/>
        : <div className="no-boxart"/>
      }
      <h4>{game.title}</h4>
      <button className="chunky-button action-button" onClick={playGame}>Play</button>
      <button className="chunky-button" onClick={openOptions}>Options</button>
    </article>
  )
}
