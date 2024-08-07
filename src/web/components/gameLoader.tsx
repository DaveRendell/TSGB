import * as React from "react"
import Memory from "../../emulator/memory/memoryMap"
import useLocalFile from "../hooks/useLocalFile"
import { Cartridge } from "../../emulator/memory/cartridges/cartridge"
import { createCartridge } from "../../emulator/memory/cartridges/createCartridge"
import { StoredGame } from "../indexedDb/storedGame"
import { getGameList, addGame, deleteGame } from "../indexedDb/gameStore"
import LibraryCard from "./libraryCard"
import GameOptions from "./gameOptions"
import { EmulatorMode } from "../../emulator/emulator"

interface Props {
  setCartridge: (cartridge: Cartridge) => void
  setMode: (mode: EmulatorMode) => void
  setColouriseDmg: (colouriseDmg: boolean) => void
}

export default function GameLoader({ setCartridge, setMode, setColouriseDmg }: Props) {
  const [storedGames, setStoredGames] = React.useState<StoredGame[] | null>(
    null,
  )
  const [lastChange, setLastChange] = React.useState(0)
  const [optionsFocusGame, setOptionsFocusGame] = React.useState<
    StoredGame | undefined
  >(undefined)
  const [error, setError] = React.useState<string>(undefined)

  React.useEffect(() => {
    getGameList().then(setStoredGames).catch(setError)
  }, [lastChange])

  const loadGame = (
    game: StoredGame,
    mode: EmulatorMode | undefined = undefined,
    colouriseDmg = false
  ) => async () => {
    const cartridge = await createCartridge(game)
    setCartridge(cartridge)
    if (mode === undefined) {
      if (cartridge.colourSupport) {
        setMode(EmulatorMode.CGB)
      } else {
        setMode(EmulatorMode.DMG)
      }
    } else {
      setMode(mode)
    }
    setColouriseDmg(colouriseDmg)
  }

  const closeOptions = () => setOptionsFocusGame(undefined)

  if (optionsFocusGame) {
    return (
      <GameOptions
        game={optionsFocusGame}
        playGame={loadGame}
        closeOptions={closeOptions}
      />
    )
  }

  const openOptions = (game: StoredGame) => () => {
    setOptionsFocusGame(game)
  }

  return (
    <section>
      <div className="floating-panel game-upload">
        <label
          htmlFor="game-load-db"
          className="chunky-button"
        >Add new game</label>
        <input
          id="game-load-db"
          type="file"
          onChange={(e) => {
            if (e.target.files && e.target.files[0]) {
              addGame(e.target.files[0]).then(() => setLastChange(Date.now()))
            }
          }}
        />
      </div>

      { error && <p>{error}</p>}
      
      {storedGames === null ? (
        <>Fetching games...</>
      ) : (
        <div className="library">
          {storedGames.map((game) => (
            <LibraryCard
              game={game}
              playGame={loadGame(game)}
              openOptions={openOptions(game)}
            />
          ))}
        </div>
      )}
    </section>
  )
}
