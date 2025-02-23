import TetrisConnection from "../tetrisConnection"
import TetrisState from "../tetrisState"
import PrimaryRoundEndScreenState from "./primaryRoundEndScreenState"

interface State {
  opponentState?: "won" | "lost",
}
const ROUND_END_SCREEN = 0x43
const RESULT_TRANSFER_COMPLETE = 0x02
const WON_ROUND_BYTE = 0x77
const LOST_ROUND_BYTE = 0xAA
const SECONDARY_ROUND_ENDING = 0x34

export default class PrimaryRoundEndingState extends TetrisState {
  state: State
  name = "primary-round-ending"

  constructor(connection: TetrisConnection, opponentState?: "won" | "lost") {
    super(connection)
    this.state = { opponentState }
  }

  override onReceiveByteFromConsole(
    byte: number,
    respond: (response: number) => void
  ): void {
    if (this.state.opponentState) {
      respond(
        this.state.opponentState === "won"
          ? WON_ROUND_BYTE
          : LOST_ROUND_BYTE)
      this.state.opponentState = undefined
      return
    }
    if (byte === ROUND_END_SCREEN) {
      this.connection.setGameState(
        new PrimaryRoundEndScreenState(this.connection)
      )
      return
    }
    
    respond(SECONDARY_ROUND_ENDING)
  }
}