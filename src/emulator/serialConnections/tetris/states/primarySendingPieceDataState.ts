import TetrisConnection from "../tetrisConnection"
import { TetrisMessage } from "../tetrisMessages"
import TetrisState from "../tetrisState"
import PrimaryInGameState from "./primaryInGameState"

interface State {
  dataBuffer: number[],
  finished: boolean,
  lineData: number[],
  handshakeCounter: number,
}
const HANDSHAKE = [0x30, 0x00, 0x44, 0x44]
const DATA_FINISHED = 0x30
const DATA_FINISHED_RESPONSE = 0x56
const NEGOTIATION_RESPONSE_BYTE = 0x55

export default class PrimarySendingPieceDataState extends TetrisState {
  state: State
  name = "primary-sending-piece-data"

  constructor(connection: TetrisConnection, lineData: number[]) {
    super(connection)
    this.state = {
      dataBuffer: [],
      finished: false,
      handshakeCounter: 0,
      lineData,
    }
  }

  override onReceiveByteFromConsole(
    byte: number,
    respond: (response: number) => void
  ): void {
    if (this.state.finished) {
      const response = HANDSHAKE[this.state.handshakeCounter++] || HANDSHAKE.at(-1)
      respond(response)
      if (this.state.handshakeCounter === 4) {
        this.connection.setClockMs(500)
      }
    } else if (byte === DATA_FINISHED) {
      this.connection.sendMessage({
        type: "round-data",
        pieceData: [...this.state.dataBuffer],
        lineData: [...this.state.lineData],
      })
      this.state.finished = true
      respond(DATA_FINISHED_RESPONSE)
    } else {
      this.state.dataBuffer.push(byte)
      respond(0x00)
    }
  }

  override onClockTimeout(): void {
    if (this.state.finished) {
      this.connection.serialRegisters.responseFromSecondary(NEGOTIATION_RESPONSE_BYTE)
      this.connection.setGameState(
        new PrimaryInGameState(this.connection)
      )
    }
  }
}