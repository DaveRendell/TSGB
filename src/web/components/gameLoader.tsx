import * as React from "react"
import { createCartridge } from "../../emulator/memory/cartridges/createCartridge"
import { StoredGame } from "../indexedDb/storedGame"
import { getGameList, addGame } from "../indexedDb/gameStore"
import LibraryCard from "./libraryCard"
import GameOptions from "./gameOptions"
import { Emulator, EmulatorMode } from "../../emulator/emulator"
import parseMap from "../../emulator/debug/parseMap"
import { DebugMap } from "../../emulator/debug/types"

interface Props {
  setEmulator: (emulator: Emulator) => void
}

export default function GameLoader({ setEmulator }: Props) {
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
    colouriseDmg = false,
    debug: boolean = false,
    borderEnabled: boolean = false,
  ) => async () => {
    const cartridge = await createCartridge(game)
    mode ??= cartridge.colourSupport
        ? EmulatorMode.CGB
        : EmulatorMode.DMG
    const debugMap: DebugMap = game.mapFile
      ? await parseMap(game.mapFile)
      : undefined
    const emulator = new Emulator(
      cartridge,
      mode,
      colouriseDmg,
      debugMap,
      game,
      borderEnabled
    )
    if (!debug) {
      emulator.cpu.run()
    }
    setEmulator(emulator)
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
          {storedGames.map((game, i) => (
            <LibraryCard
              game={game}
              playGame={loadGame(game)}
              openOptions={openOptions(game)}
              key={i}
            />
          ))}
        </div>
      )}
    </section>
  )
}
