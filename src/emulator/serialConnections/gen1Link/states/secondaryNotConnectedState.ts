import Gen1Connection from "../gen1Connection"
import Gen1Message from "../gen1Message"
import Gen1State from "../gen1State"
import SecondarySelectingLinkTypeState from "./secondarySelectingLinkTypeState"


interface State {
  remoteConnected: boolean
  zeroSent: boolean
}
const CONNECTED = 0x60
const ZERO = 0x00
const PRIMARY = 0x01
const SECONDARY = 0x02

export default class SecondaryNotConnectedState extends Gen1State {
  state: State
  name = "secondary-not-connected"

  constructor(connection: Gen1Connection) {
    super(connection)
    this.state = {
      remoteConnected: false,
      zeroSent: false
    }
  }

  override onEntry(): void {
    this.connection.setClockMs(30)
  }

  override onReceiveByteFromConsole(
    byte: number,
    respond: (response: number) => void
  ): void {
    
  }

  override onReceiveMessage(message: Gen1Message): void {
    if (message.type === "connected") {
      this.state.remoteConnected = true
    }
  }

  override onClockTimeout(): void {
    if (this.state.remoteConnected) {
      if (!this.state.zeroSent) {
        this.connection.serialRegisters.pushFromExternal(
          ZERO,
          (response) => {
            if (response === ZERO) {
              this.state.zeroSent = true
            }
          }
        )
      } else {
        this.connection.serialRegisters.pushFromExternal(
          CONNECTED,
          (response) => {
            if (response === CONNECTED) {
              this.connection.setGameState(
                new SecondarySelectingLinkTypeState(this.connection)
              )
            }
          })
      }
      
    } else {
      this.connection.serialRegisters.pushFromExternal(
        PRIMARY, (response) => {
          if (response === SECONDARY) {
            this.connection.sendMessage({ type: "connected" })
          }
        }
      )
    }
    this.connection.setClockMs(30)
  }
}