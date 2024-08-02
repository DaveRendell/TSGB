import { Emulator } from "../emulator";
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

  transferredData: string[] = []
  byteToSend = 0x00

  emulator: Emulator
  constructor(emulator: Emulator) {
    this.emulator = emulator
  }

  state: State = "NOT_CONNECTED"

  transferCounter = 0
  monToSend = 0

  onReceiveByteFromConsole(byte: number, respond: (byte: number) => void): void {
    switch (this.state) {
      case "NOT_CONNECTED":
        if (byte === CONNECTED) {
          this.setState("WAITING_FOR_LINK_TYPE")
          respond(CONNECTED)
          return
        }
        if (this.isPrimary) { respond(PRIMARY) } else { respond(SECONDARY) }
        return

      case "WAITING_FOR_LINK_TYPE":
        switch (byte) {
          case CONNECTED:
            respond(CONNECTED)
            return
          case SELECT_TRADE:
            this.setState("SELECTED_TRADE")
            respond(CONNECTED)
            return
          case SELECT_BATTLE:
            console.log("[LINK]: Error - battles not supported")
            this.setState("NOT_CONNECTED")
            respond(CONNECTED)
            return
          case SELECT_CANCEL:
            this.setState("NOT_CONNECTED")
            respond(CONNECTED)
            return
        }

      case "SELECTED_TRADE":
        if (byte === TERMINATOR) {
          this.setState("WAITING_FOR_RANDOM_SEED")
        }
        respond(byte)
        return

      case "WAITING_FOR_RANDOM_SEED":
        if (byte !== TERMINATOR) {
          this.setState("SENDING_RANDOM_SEED")
        }
        respond(byte)
        return

      case "SENDING_RANDOM_SEED":
        if (byte === TERMINATOR) {
          this.setState("WAITING_FOR_TRAINER_DATA")
        }
        respond(byte)
        return

      case "WAITING_FOR_TRAINER_DATA":
        if (byte !== TERMINATOR) {
          this.transferCounter = 1
          this.transferredData.push(byte.toString(16).padStart(2, "0"))
          this.setState("SENDING_TRAINER_DATA")
          this.byteToSend = byte
        }
        respond(TERMINATOR)
        return

      case "SENDING_TRAINER_DATA":
        if (this.transferCounter < 424) {
          this.transferredData.push(byte.toString(16).padStart(2, "0"))
          this.transferCounter++
          const lastByte = this.byteToSend
          this.byteToSend = byte
          respond(lastByte) // Hopefully results in mirrored data?
          return
        }
        
        if (this.transferCounter >= 424) {
          this.setState("WAITING_FOR_TRADE")
          this.transferCounter = 0
          respond(TERMINATOR)
          return
        }

        // console.log({
        //   transferCounter: this.transferCounter,
        //   byte,
        // })
        break

      case "WAITING_FOR_TRADE":
        if (byte === TRADE_MENU_CLOSED) {
          this.setState("SELECTED_TRADE")
          respond(0x00)
          return
        }

        if (byte >= PARTY_SELECT_OFFSET && byte < PARTY_SELECT_OFFSET + 5) {
          this.monToSend = byte - PARTY_SELECT_OFFSET

          // For mirroring just return the same result
          this.setState("TRADE_INITIATED")
          respond(0x00)
          return
        }

        // NOTE: This line hides that we're actually exchanging a 200 byte long
        // "patch list" that prevents the exchanged data being entirely messed 
        // up. Should probably add as explicit step for non mirrored trading.
        respond(byte)  
        return

      case "TRADE_INITIATED":
        if (byte != 0) {
          respond(PARTY_SELECT_OFFSET + this.monToSend)
          return
        }

        // DEBUG
        const localPlayerData: string[] = []
        const opposingPlayerData: string[] = []
        for (let pointer = 0xD158; pointer <= 0xD2F6; pointer++) {
          localPlayerData.push(this.emulator.memory.at(pointer).byte.toString(16).padStart(2, "0"))
        }
        for (let pointer = 0xD89C; pointer <= 0xDA2F; pointer++) {
          opposingPlayerData.push(this.emulator.memory.at(pointer).byte.toString(16).padStart(2, "0"))
        }
        console.log({
          localPlayerData,
          opposingPlayerData,
          transferredData: this.transferredData,
        })
        this.setState("TRADE_CONFIRMED")
        break

      case "TRADE_CONFIRMED":
        if (byte === TRADE_CANCELLED) {
          this.setState("TRADE_CANCELLED")
          respond(0x00)
          return
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

    respond(0x00)
    return
  }

  private setState(state: State) {
    console.log("Setting state to", state)
    this.state = state
  }

  updateClock(cycles: number): void {}
}