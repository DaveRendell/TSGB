import TetrisConnection from "../tetrisConnection"
import { TetrisMessage } from "../tetrisMessages"
import TetrisState from "../tetrisState"
import SecondaryDifficultySelectionState from "./secondaryDifficultySelectionState"

interface State {
  currentSelection: number
}
const MUSIC_CHOICE_CONFIRM = 0x50

export default class SecondaryMusicSelectionState extends TetrisState {
  state: State
  name = "secondary-music-selection"

  constructor(connection: TetrisConnection) {
    super(connection)
    this.state = { currentSelection: 0 }
  }

  override onEntry(): void {
    this.connection.setClockMs(30)
  }

  override onReceiveByteFromConsole(
    byte: number,
    respond: (response: number) => void
  ): void {
    
  }

  override onReceiveMessage(message: TetrisMessage): void {
    if (message.type === "music-selection-update") {
      this.state.currentSelection = message.selection
    }

    if (message.type === "music-confirmation") {
      this.connection.serialRegisters.pushFromExternal(MUSIC_CHOICE_CONFIRM)
      this.connection.setGameState(
        new SecondaryDifficultySelectionState(this.connection)
      )
    }
  }

  override onClockTimeout(): void {
    this.connection.setClockMs(30)
    this.connection.serialRegisters.pushFromExternal(this.state.currentSelection)
  }
}