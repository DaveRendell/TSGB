import * as React from "react"
import { StoredGame } from "../indexedDb/storedGame"
import { deleteGame, persistSave, updateGame } from "../indexedDb/gameStore"
import "../gameOptions.css"
import { EmulatorMode } from "../../emulator/emulator"
import { addressDisplay } from "../../helpers/displayHexNumbers"

interface Props {
  game: StoredGame
  playGame: (game: StoredGame, mode: EmulatorMode | undefined, colouriseDmg: boolean) => () => Promise<void>
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

  const updateMap = async (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault()
    if (e.target.files && e.target.files[0]) {
      const mapFile = e.target.files[0]
      game.mapFile = mapFile
      await updateGame(game)
    }
  }

  const deleteSave = async () => {
    game.save = undefined
    await updateGame(game)
  }

  const resetRTC = async () => {
    game.rtc = undefined
    await updateGame(game)
  }

  const colourSupportByte = game.data[0x143]
  const colourSupport = (colourSupportByte & 0x80) > 0
  const colourExclusive = (colourSupportByte & 0x40) > 0

  return (
    <section className="game-options floating-panel">
      <h2>{name}</h2>
      <div>
        {
          !colourSupport && <>
            <button className="chunky-button action-button" onClick={playGame(game, EmulatorMode.DMG, false)}>Play</button>
            <button className="chunky-button action-button" onClick={playGame(game, EmulatorMode.DMG, true)}>Play (colourised)</button>
          </>
        }
        {
          (colourSupport && !colourExclusive) && <>
            <button className="chunky-button action-button" onClick={playGame(game, EmulatorMode.CGB, false)}>Play in Colour mode</button>
            <button className="chunky-button action-button" onClick={playGame(game, EmulatorMode.DMG, false)}>Play in Monochrome mode</button>
          </>
        }
        {
          (colourSupport && colourExclusive) && <>
            <button className="chunky-button action-button" onClick={playGame(game, EmulatorMode.CGB, false)}>Play</button>
          </>
        }
        {
          <>
            <button className="chunky-button action-button" onClick={playGame(game, EmulatorMode.SGB, false)}>Play (Super Mode)</button>
          </>
        }
        <button className="chunky-button" onClick={closeOptions}>Back</button>
        <br />
      </div>
      <br />
      <form onSubmit={updateName}>
        <input
          type="text"
          id="name-update"
          onChange={e => {e.preventDefault(); setName(e.target.value)}}
          value={name}
        />
        <input
          className="chunky-button"
          type="submit"
          value="Update name"
        />
      </form><br/>
      <button className="chunky-button" onClick={downloadSave}>Export Save</button>
      <br />
      <label htmlFor="save-import">Import save</label>
      <input id="save-import" type="file" onChange={importSave} />
      <br />
      <label htmlFor="set-boxart">Set boxart</label>
      <input id="set-boxart" type="file" onChange={updateBoxArt} />
      <br />
      <label htmlFor="set-map">Set map file for debugging</label>
      <input id="set-map" type="file" onChange={updateMap} />
      <br />
      <button className="chunky-button" onClick={resetRTC}>Reset RTC</button>
      <br />
      <br />
      <h3>Danger zone</h3>
      <button className="chunky-button danger-button" onClick={() => deleteGame(game.id)}>Delete Game</button>
      <button className="chunky-button danger-button" onClick={() => deleteSave()}>Delete Save</button>
      <br />
      {game.breakpoints && game.breakpoints.length > 0 && <>
          Breakpoints:
          <ul>
            {game.breakpoints.map(breakpoint =>
              <li key={breakpoint.join(":")}><code>{breakpoint[0]}:{addressDisplay(breakpoint[1])}</code></li>
            )}
          </ul>
        </>
      }
    </section>
  )
}
