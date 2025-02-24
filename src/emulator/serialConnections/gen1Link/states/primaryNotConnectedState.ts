import Gen1Connection from "../gen1Connection"
import Gen1Message from "../gen1Message"
import Gen1State from "../gen1State"
import PrimarySelectingLinkTypeState from "./primarySelectingLinkTypeState"


interface State {
  remoteConnected: boolean
}
const CONNECTED = 0x60
const ZERO = 0x00
const PRIMARY = 0x01
const SECONDARY = 0x02

export default class PrimaryNotConnectedState extends Gen1State {
  state: State
  name = "primary-not-connected"

  constructor(connection: Gen1Connection) {
    super(connection)
    this.state = {
      remoteConnected: false
    }
  }

  override onReceiveByteFromConsole(
    byte: number,
    respond: (response: number) => void
  ): void {
    if (this.state.remoteConnected) {
      if (byte === ZERO) {
        respond(ZERO)
        return
      }
      if (byte === CONNECTED) {
        respond(CONNECTED)
        this.connection.setGameState(
          new PrimarySelectingLinkTypeState(this.connection)
        )
        return
      }
    }
    if (byte === PRIMARY) {
      this.connection.sendMessage({ type: "connected" })
      respond(SECONDARY)
    }
  }

  override onReceiveMessage(message: Gen1Message): void {
    if (message.type === "connected") {
      this.state.remoteConnected = true
    }
  }
}