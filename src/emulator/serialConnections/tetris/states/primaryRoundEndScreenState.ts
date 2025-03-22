import TetrisConnection from "../tetrisConnection"
import { TetrisMessage } from "../tetrisMessages"
import TetrisState from "../tetrisState"
import PrimaryDataHandshakeState from "./primaryDataHandshakeState"
import PrimaryDifficultySelectionState from "./primaryDifficultySelectionState"

interface State {
}
const NEXT_ROUND_REQUEST = 0x60
const NEXT_ROUND_ACKNOLEDGEMENT = 0x27
const NEXT_ROUND = 0x79

export default class PrimaryRoundEndScreenState extends TetrisState {
  state: State
  name = "primary-round-end-screen"

  constructor(connection: TetrisConnection) {
    super(connection)
    this.state = {
      waiting: true,
      byteCounter: 0,
    }
  }

  override onEntry(): void {
    
  }

  override onReceiveByteFromConsole(
    byte: number,
    respond: (response: number) => void
  ): void {
    if (byte === NEXT_ROUND_REQUEST) {
      respond(NEXT_ROUND_ACKNOLEDGEMENT)
      return
    }
    if (byte === NEXT_ROUND) {
      if (this.connection.gameOver()) {
        this.connection.roundsWon = 0
        this.connection.opponentRoundsWon = 0
        this.connection.setGameState(
          new PrimaryDifficultySelectionState(this.connection)
        )
        this.connection.sendMessage({ type: "next-round" })
        return
      }
      this.connection.setGameState(
        new PrimaryDataHandshakeState(this.connection)
      )
    }
  }

  override onClockTimeout(): void {
    
  }
}