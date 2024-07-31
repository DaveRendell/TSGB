import { SerialConnection } from "./serialConnection";

// Heavily inspired by code from https://github.com/mwpenny/gbplay/blob/master/tools/pokered-mock-trade/trader.py
type State =
  "NOT_CONNECTED" |
  "WAITING_FOR_LINK_TYPE" |
  "SELECTED_TRADE" |
  "WAITING_FOR_RANDOM_SEED" |
  "SENDING_RANDOM_SEED" |
  "WAITING_FOR_TRAINER_DATA" |
  "SENDING_TRAINER_DATA" |
  "WAITING_FOR_TRADE" |
  "TRADE_INITIATED" |
  "TRADE_CONFIRMED" |
  "TRADE_CANCELLED"

const CONNECTED = 0x60
const PRIMARY = 0x01
const SECONDARY = 0x02
const SELECT_TRADE = 0xD4
const SELECT_BATTLE = 0xD5
const SELECT_CANCEL = 0xD6
const TERMINATOR = 0xFD
const TRADE_MENU_CLOSED = 0x6F
const PARTY_SELECT_OFFSET = 0x60
const TRADE_CANCELLED = 0x61
const TRADE_CONFIRMED = 0x62

const TRAINER_DATA_SIZE = 424

export class MonGen1MirrorConnection implements SerialConnection {
  isConnected: boolean = true
  isPrimary = false

  state: State = "NOT_CONNECTED"

  transferCounter = 0
  monToSend = 0

  onReceiveByteFromConsole(byte: number): number {
    switch (this.state) {
      case "NOT_CONNECTED":
        if (byte === CONNECTED) {
          this.setState("WAITING_FOR_LINK_TYPE")
          return CONNECTED
        }
        if (this.isPrimary) { return PRIMARY } else { return SECONDARY }

      case "WAITING_FOR_LINK_TYPE":
        switch (byte) {
          case CONNECTED:
            return CONNECTED
          case SELECT_TRADE:
            this.setState("SELECTED_TRADE")
            return CONNECTED
          case SELECT_BATTLE:
            console.log("[LINK]: Error - battles not supported")
            this.setState("NOT_CONNECTED")
            return CONNECTED
          case SELECT_CANCEL:
            this.setState("NOT_CONNECTED")
            return CONNECTED
        }

      case "SELECTED_TRADE":
        if (byte === TERMINATOR) {
          this.setState("WAITING_FOR_RANDOM_SEED")
        }
        return byte

      case "WAITING_FOR_RANDOM_SEED":
        if (byte !== TERMINATOR) {
          this.setState("SENDING_RANDOM_SEED")
        }
        console.log("Waiting for random seed", byte.toString(16).padStart(2, "0"))
        return byte

      case "SENDING_RANDOM_SEED":
        if (byte === TERMINATOR) {
          this.setState("WAITING_FOR_TRAINER_DATA")
        }
        console.log("receiving random seed", byte.toString(16).padStart(2, "0"))
        return byte

      case "WAITING_FOR_TRAINER_DATA":
        if (byte !== TERMINATOR) {
          this.transferCounter = 1
          this.setState("SENDING_TRAINER_DATA")
          return byte
        }
        return TERMINATOR

      case "SENDING_TRAINER_DATA":
        if (this.transferCounter < 424) {
          console.log("trainer data send", byte.toString(16).padStart(2, "0"), String.fromCharCode(byte - 0x80 + 65), String.fromCharCode(byte - 0xa0 + 97))
          this.transferCounter++
          return byte // Hopefully results in mirrored data?
        }
        
        if (this.transferCounter >= 424) {
          this.setState("WAITING_FOR_TRADE")
          this.transferCounter = 0
          return TERMINATOR
        }

        // console.log({
        //   transferCounter: this.transferCounter,
        //   byte,
        // })
        break

      case "WAITING_FOR_TRADE":
        if (byte === TRADE_MENU_CLOSED) {
          this.setState("SELECTED_TRADE")
          return 0x00
        }

        if (byte >= PARTY_SELECT_OFFSET && byte < PARTY_SELECT_OFFSET + 5) {
          this.monToSend = byte - PARTY_SELECT_OFFSET

          // For mirroring just return the same result
          this.setState("TRADE_INITIATED")
          return 0x00
        }
        break

      case "TRADE_INITIATED":
        if (byte != 0) {
          return PARTY_SELECT_OFFSET + this.monToSend
        }
        this.setState("TRADE_CONFIRMED")
        break

      case "TRADE_CONFIRMED":
        if (byte === TRADE_CANCELLED) {
          this.setState("TRADE_CANCELLED")
          return 0x00
        }
        if (byte === TRADE_CONFIRMED) {
          // Back to room for more trading
          this.setState("SELECTED_TRADE")
        }
        break
      
      case "TRADE_CANCELLED":
        if (byte === 0) {
          this.setState("WAITING_FOR_TRADE")
        }
        break
    }

    return 0x00
  }

  private setState(state: State) {
    console.log("Setting state to", state)
    this.state = state
  }
}