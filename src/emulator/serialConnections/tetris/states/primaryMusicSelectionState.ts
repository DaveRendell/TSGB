import TetrisConnection from "../tetrisConnection";
import TetrisState from "../tetrisState";
import PrimaryDifficultySelectionState from "./primaryDifficultySelectionState";

interface State {
  currentSelection: number
}

const MUSIC_CHOICE_START = 0x1C
const MUSIC_CHOICE_END = 0x1F
const MUSIC_CHOICE_CONFIRM = 0x50

export default class PrimaryMusicSelectionState extends TetrisState {
  state: State
  name = "primary-music-selection"

  constructor(connection: TetrisConnection) {
    super(connection)
    this.state = { currentSelection: 0 }
  }

  override onReceiveByteFromConsole(
    byte: number,
    respond: (response: number) => void
  ): void {
    if (MUSIC_CHOICE_START <= byte && byte <= MUSIC_CHOICE_END) {
      if (byte !== this.state.currentSelection) {
        this.state.currentSelection = byte
        this.connection.sendMessage({
          type: "music-selection-update",
          selection: byte
        })
      }

      respond(0x00)
      return
    }

    if (byte === MUSIC_CHOICE_CONFIRM) {
      this.connection.sendMessage({ type: "music-confirmation" })
      this.connection.setGameState(
        new PrimaryDifficultySelectionState(this.connection)
      )
    }
  }
}