import * as React from "react"
import Memory from "../../emulator/memory/memoryMap"
import useLocalFile from "../hooks/useLocalFile"
import { Cartridge } from "../../emulator/memory/cartridges/cartridge"
import { createCartridge } from "../../emulator/memory/cartridges/createCartridge"
import { StoredGame } from "../indexedDb/storedGame"
import { getGameList, addGame, deleteGame } from "../indexedDb/gameStore"
import LibraryCard from "./libraryCard"
import GameOptions from "./gameOptions"

interface Props {
  setCartridge: (cartridge: Cartridge) => void
}

export default function GameLoader({ setCartridge }: Props) {
  const [storedGames, setStoredGames] = React.useState<StoredGame[] | null>(
    null,
  )
  const [lastChange, setLastChange] = React.useState(0)
  const [optionsFocusGame, setOptionsFocusGame] = React.useState<
    StoredGame | undefined
  >(undefined)

  React.useEffect(() => {
    getGameList().then(setStoredGames)
  }, [lastChange])

  const loadGame = (game: StoredGame) => async () =>
    setCartridge(await createCartridge(game))

  const closeOptions = () => setOptionsFocusGame(undefined)

  if (optionsFocusGame) {
    return (
      <GameOptions
        game={optionsFocusGame}
        playGame={loadGame(optionsFocusGame)}
        closeOptions={closeOptions}
      />
    )
  }

  const openOptions = (game: StoredGame) => () => {
    setOptionsFocusGame(game)
  }

  return (
    <section>
      <h2>Library</h2>
      <label htmlFor="game-load-db">Add new game:</label>
      <input
        id="game-load-db"
        type="file"
        onChange={(e) => {
          if (e.target.files && e.target.files[0]) {
            addGame(e.target.files[0]).then(() => setLastChange(Date.now()))
          }
        }}
      />
      {storedGames === null ? (
        <>Fetching games...</>
      ) : (
        <>
          {storedGames.map((game) => (
            <LibraryCard
              game={game}
              playGame={loadGame(game)}
              openOptions={openOptions(game)}
            />
          ))}
        </>
      )}
    </section>
  )
}
