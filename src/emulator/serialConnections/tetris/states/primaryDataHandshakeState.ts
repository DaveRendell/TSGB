import TetrisConnection from "../tetrisConnection"
import { TetrisMessage } from "../tetrisMessages"
import TetrisState from "../tetrisState"
import PrimarySendingLineDataState from "./primarySendingLineDataState"

interface State {
  started: boolean
}
const NEGOTIATION_REQUEST_BYTE = 0x29
const NEGOTIATION_RESPONSE_BYTE = 0x55

export default class PrimaryDataHandshakeState extends TetrisState {
  state: State
  name =  "primary-data-handshake"

  constructor(connection: TetrisConnection) {
    super(connection)
    this.state = { started: false }
  }

  override onEntry(): void {
    
  }

  override onReceiveByteFromConsole(
    byte: number,
    respond: (response: number) => void
  ): void {
    if (byte === NEGOTIATION_REQUEST_BYTE) {
      this.state.started = true
      this.connection.setClockMs(30)
    }
  }

  override onReceiveMessage(message: TetrisMessage): void {
    
  }

  override onClockTimeout(): void {
    if (this.state.started) {
      this.connection.serialRegisters.responseFromSecondary(NEGOTIATION_RESPONSE_BYTE)
      this.connection.setGameState(
        new PrimarySendingLineDataState(this.connection)
      )
    }
  }
}