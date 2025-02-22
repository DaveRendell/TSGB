import TetrisConnection from "../tetrisConnection"
import { TetrisMessage } from "../tetrisMessages"
import TetrisState from "../tetrisState"
import PrimaryDataHandshakeState from "./primaryDataHandshakeState"

interface State {
  localSelection: number
  remoteSelection: number
}
const DIFFICULTY_CHOICE_START = 0x00
const DIFFICULTY_CHOICE_END = 0x05
const DIFFICULTY_CHOICE_CONFIRM = 0x60
const DIFFICULTY_CHOICE_RESPONSE = 0x55

export default class PrimaryDifficultySelectionState extends TetrisState {
  state: State
  name =  "primary-difficulty-selection"

  constructor(connection: TetrisConnection) {
    super(connection)
    this.state = { localSelection: 0, remoteSelection: 0 }
  }

  override onReceiveByteFromConsole(
    byte: number,
    respond: (response: number) => void
  ): void {
    if (DIFFICULTY_CHOICE_START <= byte && byte <= DIFFICULTY_CHOICE_END) {
      if (byte !== this.state.localSelection) {
        this.state.localSelection = byte
        this.connection.sendMessage({
          type: "difficulty-selection",
          selection: byte
        })
      }
      respond(this.state.remoteSelection)
      return
    }

    if (byte === DIFFICULTY_CHOICE_CONFIRM) {
      this.connection.setGameState(
        new PrimaryDataHandshakeState(this.connection)
      ) // QQ primary-data-handshake
      respond(DIFFICULTY_CHOICE_RESPONSE)
    }
  }

  override onReceiveMessage(message: TetrisMessage): void {
    if (message.type === "difficulty-selection") {
      this.state.remoteSelection = message.selection
    }
  }
}