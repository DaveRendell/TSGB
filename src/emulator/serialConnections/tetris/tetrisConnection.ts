import { valueDisplay } from "../../../helpers/displayHexNumbers";
import StateMachine from "../../../helpers/stateMachine";
import SerialRegisters from "../../memory/registers/serialRegisters";
import OnlineConnection from "../onlineConnection";
import GameStates from "./tetrisGameStates";
import { TetrisMessage } from "./tetrisMessages";

const NEGOTIATION_REQUEST_BYTE = 0x29
const NEGOTIATION_RESPONSE_BYTE = 0x55

const CLOCKS_30_MS = 30 * 4194304 / 1000


export default class TetrisConnection extends OnlineConnection {

  clockTimer: number = 0

  gameState = new StateMachine<GameStates>(
    { name: "negotiation", negotiationRequested: false },
    { logPrefix: "TETRIS", logStateChanges: true}
  )

  constructor(serialRegisters: SerialRegisters) {
    super(serialRegisters)
  }

  override onReceiveByteFromConsole(byte: number, ): number {
    console.log("byte received:", byte)
    if (this.state.name === "disconnected") { return 0xFF }

    if (this.gameState.state.name == "negotiation") {
      if (byte === NEGOTIATION_REQUEST_BYTE) {
        if (!this.gameState.state.negotiationRequested) {
          this.gameState.state.negotiationRequested = true
          this.clockTimer = CLOCKS_30_MS
          const message: TetrisMessage = { type: "negotiation" }
          console.log("[TETRIS] Sending message", message)
          this.state.connection.send(message)
        }
        return NEGOTIATION_RESPONSE_BYTE
      }
        

      if (byte >= 0x1C && byte <= 0x1F) {
        console.log("YAYYY")
        this.gameState.state = {
          name: "primary-music-selection",
          currentSelection: byte
        }
        return 0x00
      }
    }

    if (this.gameState.state.name === "primary-music-selection") {
      return 0x00
    }

    console.log(`[TETRIS DEBUG] Uncaught byte ${valueDisplay(byte)} (state: ${this.gameState.state.name})`)

    return byte
  }

  override receiveMessage(message: TetrisMessage): void {
    console.log("[TETRIS] Received message", message)
    if (this.gameState.state.name === "negotiation") {
      if (message.type === "negotiation") {
        this.serialRegisters.pushFromExternal(NEGOTIATION_REQUEST_BYTE)
        this.gameState.state = { name: "secondary-music-selection", currentSelection: 0x1C }
        this.clockTimer = CLOCKS_30_MS
      }
      console.error(`Incorrect message type ${message.type} in state ${this.gameState.state.name}`)
    }
  }

  override updateClock(cycles: number): void {
    if (this.gameState.state.name === "negotiation") {
      if (this.gameState.state.negotiationRequested) {
        this.clockTimer -= cycles
        if (this.clockTimer <= 0) {
          this.serialRegisters.responseFromSecondary(NEGOTIATION_RESPONSE_BYTE)
          this.gameState.state = { name: "primary-music-selection", currentSelection: 0x1C }
        }
      }
    }

    if (this.gameState.state.name === "secondary-music-selection") {
      this.clockTimer -= cycles
      if (this.clockTimer <= 0) {
        this.clockTimer += CLOCKS_30_MS
        this.serialRegisters.pushFromExternal(this.gameState.state.currentSelection)
      }
    }
  }
}