import TetrisConnection from "../tetrisConnection";
import { TetrisMessage } from "../tetrisMessages";
import TetrisState from "../tetrisState";
import PrimaryMusicSelectionState from "./primaryMusicSelectionState";
import SecondaryMusicSelectionState from "./secondaryMusicSelectionState";

interface State {
  negotiationRequested: boolean
}

const NEGOTIATION_REQUEST_BYTE = 0x29
const NEGOTIATION_RESPONSE_BYTE = 0x55

export default class NegotiationState extends TetrisState {
  state: State
  name = "negotiation"

  constructor(connection: TetrisConnection) {
    super(connection)
    this.state = { negotiationRequested: false }
  }

  override onReceiveByteFromConsole(
    byte: number,
    respond: (response: number) => void
  ): void {
    if (byte === NEGOTIATION_REQUEST_BYTE) {
      if (!this.state.negotiationRequested) {
        this.state.negotiationRequested = true
        this.connection.setClockMs(30)
        this.connection.sendMessage({ type: "negotiation" })
      }
      respond(NEGOTIATION_RESPONSE_BYTE)
      return
    }
  }

  override onReceiveMessage(message: TetrisMessage): void {
    if (message.type === "negotiation") {
      this.connection.serialRegisters.pushFromExternal(NEGOTIATION_REQUEST_BYTE)
      this.connection.setGameState(
        new SecondaryMusicSelectionState(this.connection)
      )
    }
  }

  override onClockTimeout(): void {
    if (this.state.negotiationRequested) {
      this.connection.serialRegisters.responseFromSecondary(NEGOTIATION_RESPONSE_BYTE)
      this.connection.setGameState(
        new PrimaryMusicSelectionState(this.connection)
      )
    }
  }
}