import TetrisConnection from "../tetrisConnection"
import { TetrisMessage } from "../tetrisMessages"
import TetrisState from "../tetrisState"
import PrimarySendingPieceDataState from "./primarySendingPieceDataState"

interface State {
  dataBuffer: number[]
  finished: boolean
}
const NEGOTIATION_REQUEST_BYTE = 0x29
const NEGOTIATION_RESPONSE_BYTE = 0x55

export default class PrimarySendingLineDataState extends TetrisState {
  state: State
  name = "primary-sending-line-data"

  constructor(connection: TetrisConnection) {
    super(connection)
    this.state = {
      dataBuffer: [],
      finished: false,
    }
  }

  override onEntry(): void {
    
  }

  override onReceiveByteFromConsole(
    byte: number,
    respond: (response: number) => void
  ): void {
    if (byte === NEGOTIATION_REQUEST_BYTE) {
      this.state.finished = true
      this.connection.setClockMs(30)
    } else {
      this.state.dataBuffer.push(byte)
      respond(0x00)
    }
  }

  override onReceiveMessage(message: TetrisMessage): void {
    
  }

  override onClockTimeout(): void {
    if (this.state.finished) {
      this.connection.serialRegisters.responseFromSecondary(NEGOTIATION_RESPONSE_BYTE)
      this.connection.setGameState(
        new PrimarySendingPieceDataState(
          this.connection, [...this.state.dataBuffer]
        )
      )
    }
  }
}