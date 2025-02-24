import Gen1Connection from "../gen1Connection"
import Gen1Message from "../gen1Message"
import Gen1State from "../gen1State"
import SecondaryNotConnectedState from "./secondaryNotConnectedState"
import SecondarySelectedTradeState from "./secondarySelectedTradeState"


interface State {
  selected: "trade" | "battle" | "cancel"
  remoteConfirmed: boolean
}
const CONNECTED = 0x60
const SELECT_TRADE = 0xD0
const SELECT_BATTLE = 0xD1
const SELECT_CANCEL = 0xD2
const CONFIRM_TRADE = 0xD4
const CONFIRM_BATTLE = 0xD5
const CONFIRM_CANCEL = 0xD6

export default class SecondarySelectingLinkTypeState extends Gen1State {
  state: State
  name = "secondary-selecting-link-type"

  constructor(connection: Gen1Connection) {
    super(connection)
    this.state = {
      selected: "trade",
      remoteConfirmed: false,
    }
  }

  override onEntry(): void {
    this.connection.setClockMs(5)
  }

  override onReceiveMessage(message: Gen1Message): void {
    if (message.type === "select-link-type") {
      this.state.selected = message.linkType
    }

    if (message.type === "confirm-link-type") {
      this.state.remoteConfirmed = true
      this.state.selected = message.linkType
    }
  }

  override onClockTimeout(): void {
    this.connection.serialRegisters.pushFromExternal(
      this.getByte(),
      (byte) => {
        switch(byte) {
          case SELECT_TRADE:
            if (this.state.selected !== "trade") {
              this.state.selected = "trade"
              this.connection.sendMessage({
                type: "select-link-type", linkType: "trade"
              })
            }        
            break
          case SELECT_BATTLE:
            if (this.state.selected !== "battle") {
              this.state.selected = "battle"
              this.connection.sendMessage({
                type: "select-link-type", linkType: "battle"
              })
            }        
            break
          case SELECT_CANCEL:
            if (this.state.selected !== "cancel") {
              this.state.selected = "cancel"
              this.connection.sendMessage({
                type: "select-link-type", linkType: "cancel"
              })
            }        
            break
          case CONFIRM_TRADE:
            this.connection.setGameState(
              new SecondarySelectedTradeState(this.connection)
            )
            this.connection.sendMessage({
              type: "confirm-link-type", linkType: "trade"
            })
            break
          case CONFIRM_BATTLE:
            console.error("[LINK]: Error - battles not supported")
            this.connection.setGameState(
              new SecondaryNotConnectedState(this.connection)
            )
            this.connection.sendMessage({
              type: "confirm-link-type", linkType: "battle"
            })
            break
          case CONFIRM_CANCEL:
            this.connection.setGameState(
              new SecondaryNotConnectedState(this.connection)
            )
            this.connection.sendMessage({
              type: "confirm-link-type", linkType: "cancel"
            })
            break
        }
      }
    )
    this.connection.setClockMs(15)
  }

  private getByte(): number {
    if (this.state.remoteConfirmed) {
      switch(this.state.selected) {
        case "trade":
          this.connection.setGameState(
            new SecondarySelectedTradeState(this.connection)
          )
          return CONFIRM_TRADE
        case "battle":
          this.connection.setGameState(
            new SecondaryNotConnectedState(this.connection)
          )
          return CONFIRM_BATTLE
        case "cancel":
          this.connection.setGameState(
            new SecondaryNotConnectedState(this.connection)
          )
          return CONFIRM_CANCEL
      }
    }
    switch(this.state.selected) {
      case "trade": return SELECT_TRADE
      case "battle": return SELECT_BATTLE
      case "cancel": return SELECT_CANCEL
    }
  }
}