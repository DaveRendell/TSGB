import TetrisConnection from "../tetrisConnection"
import { TetrisMessage } from "../tetrisMessages"
import TetrisState from "../tetrisState"
import SecondaryDataTransferState from "./secondaryDataTransferState"
import SecondaryDifficultySelectionState from "./secondaryDifficultySelectionState"

interface State {
  waiting: boolean,
  firstByteSent: boolean,
  roundOver: boolean,
  lineData: number[],
  pieceData: number[],
}
const NEXT_ROUND_REQUEST = 0x60
const NEXT_ROUND_ACKNOLEDGEMENT = 0x27
const NEXT_ROUND = 0x79

export default class SecondaryRoundEndScreenState extends TetrisState {
  state: State
  name = "secondary-round-end-screen"

  constructor(connection: TetrisConnection) {
    super(connection)
    this.state = {
      waiting: true,
      firstByteSent: false,
      roundOver: false,
      lineData: [],
      pieceData: [],
    }
  }

  override onEntry(): void {
    
  }

  override onReceiveMessage(message: TetrisMessage): void {
    if (message.type === "round-data") {
      this.state.waiting = false
      this.state.lineData = message.lineData
      this.state.pieceData = message.pieceData
      this.connection.setClockMs(5)
      return
    }

    if (message.type === "next-round") {
      this.state.waiting = false
      this.state.roundOver = true
      this.connection.setClockMs(5)
      return
    }
  }

  override onClockTimeout(): void {
    if (this.state.waiting) { return }

    if (!this.state.firstByteSent) {
      this.connection.serialRegisters.pushFromExternal(
        NEXT_ROUND_REQUEST,
        (response) => {
          if (response === NEXT_ROUND_ACKNOLEDGEMENT) {
            this.state.firstByteSent = true
          }
          this.connection.setClockMs(30)
        }
      )
    } else {
      this.connection.serialRegisters.pushFromExternal(
        NEXT_ROUND,
        (response) => {
          if (response === NEXT_ROUND_ACKNOLEDGEMENT) {
            if (this.state.roundOver) {
              this.connection.setGameState(
                new SecondaryDifficultySelectionState(this.connection)
              )
              return
            }
            this.connection.setGameState(
              new SecondaryDataTransferState(
                this.connection, this.state.pieceData, this.state.lineData, false
              )
            )
          }
          this.connection.setClockMs(30)
        }
      )
    }


  }
}