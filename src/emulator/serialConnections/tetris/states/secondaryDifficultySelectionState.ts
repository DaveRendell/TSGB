import TetrisConnection from "../tetrisConnection"
import { TetrisMessage } from "../tetrisMessages"
import TetrisState from "../tetrisState"
import SecondaryDataTransferState from "./secondaryDataTransferState"
import SecondaryInGameState from "./secondaryInGameState"

interface State {
  localSelection: number
  remoteSelection: number
}

export default class SecondaryDifficultySelectionState extends TetrisState {
  state: State
  name = "secondary-difficulty-selection"

  constructor(connection: TetrisConnection) {
    super(connection)
    this.state = { localSelection: 0, remoteSelection: 0 }
  }

  override onEntry(): void {
    this.connection.setClockMs(30)
  }

  override onReceiveMessage(message: TetrisMessage): void {
    if (message.type === "difficulty-selection") {
      this.state.remoteSelection = message.selection
    }

    if (message.type === "round-data") {
      console.log("length?", message.lineData.length, message.lineData)
      this.connection.setGameState(
        new SecondaryDataTransferState(this.connection, message.pieceData, message.lineData, true)
      )
    }
  }

  override onClockTimeout(): void {
    this.connection.setClockMs(30)
    this.connection.serialRegisters.pushFromExternal(this.state.remoteSelection, (selection) => {
      if (selection !== this.state.localSelection) {
        this.state.localSelection = selection
        this.connection.sendMessage({
          type: "difficulty-selection",
          selection,
        })
      }
    })
  }
}