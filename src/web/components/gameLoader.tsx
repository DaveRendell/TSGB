import * as React from "react"
import Memory from "../../emulator/memory"
import useLocalFile from "../hooks/useLocalFile"
import { Cartridge } from "../../emulator/memory/cartridges/cartridge"
import { createCartridge } from "../../emulator/memory/cartridges/createCartridge"
import { StoredGame } from "../indexedDb/storedGame"
import { getGameList, addGame, deleteGame } from "../indexedDb/gameStore"

interface Props {
  setCartridge: (cartridge: Cartridge) => void
}

export default function GameLoader({ setCartridge }: Props) {
  const [storedGames, setStoredGames] = React.useState<StoredGame[] | null>(null)
  const [lastChange, setLastChange] = React.useState(0)

  React.useEffect(() => {
    getGameList().then(setStoredGames)
  }, [lastChange])

  return (<section>
    <h2>Library</h2>
    <input
      id="game-load-db"
      type="file"
      onChange={(e) => {
        if (e.target.files && e.target.files[0]) {
          addGame(e.target.files[0]).then(() => setLastChange(Date.now()))        
        }
      }}
    />
    { storedGames === null
      ? <>Fetching games...</>
      : <>
          <h3>Stored games</h3><ul>
          {
            storedGames.map(game =>
              <li>{game.title}
              {/* <button onClick={() => {
                deleteGame(game.id).then(() => setLastChange(Date.now()))
              }}>Delete</button> */}
              <button onClick={async () => {
                const cartridge = await createCartridge(game)
                setCartridge(cartridge)
              }}>Play</button></li>)
          }
          </ul>
        </>
    }
  </section>)
}