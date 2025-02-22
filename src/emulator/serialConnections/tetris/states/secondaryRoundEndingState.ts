import TetrisConnection from "../tetrisConnection"
import { TetrisMessage } from "../tetrisMessages"
import TetrisState from "../tetrisState"
import SecondaryRoundEndScreenState from "./secondaryRoundEndScreenState"

interface State {
  opponentState?: "won" | "lost"
  stage: "waiting" | "responding" | "terminating"
}
const WON_ROUND_BYTE = 0x77
const LOST_ROUND_BYTE = 0xAA
const ROUND_END_SCREEN = 0x43
const SECONDARY_ROUND_ENDING = 0x34

export default class SecondaryRoundEndingState extends TetrisState {
  state: State
  name = "secondary-round-ending"

  constructor(connection: TetrisConnection, opponentState?: "won" | "lost") {
    super(connection)
    this.state = {
      opponentState,
      stage: "waiting",
    }
  }

  override onEntry(): void {
    this.connection.setClockMs(5)
  }

  override onClockTimeout(): void {
    switch (this.state.stage) {
      case "waiting":
      const pushByte = this.state.opponentState === "won"
        ? WON_ROUND_BYTE
        : this.state.opponentState === "lost"
          ? LOST_ROUND_BYTE
          : 0x00
      this.connection.serialRegisters.pushFromExternal(
        pushByte, (response) => {
          if (response === SECONDARY_ROUND_ENDING) {
            this.state.stage = "responding"
          }
        })
        this.connection.setClockMs(5)
        break
      case "responding":
        this.connection.serialRegisters.pushFromExternal(SECONDARY_ROUND_ENDING)
        this.state.stage = "terminating"
        this.connection.setClockMs(500)
      case "terminating":
        this.connection.serialRegisters.pushFromExternal(ROUND_END_SCREEN)
        this.connection.setGameState(
          new SecondaryRoundEndScreenState(this.connection)
        )
    }
  }
}