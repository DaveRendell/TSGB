import { valueDisplay } from "../../../helpers/displayHexNumbers";
import StateMachine from "../../../helpers/stateMachine";
import SerialRegisters from "../../memory/registers/serialRegisters";
import OnlineConnection from "../onlineConnection";
import GameStates from "./tetrisGameStates";
import { TetrisMessage } from "./tetrisMessages";

const NEGOTIATION_REQUEST_BYTE = 0x29
const NEGOTIATION_RESPONSE_BYTE = 0x55
const MUSIC_CHOICE_START = 0x1C
const MUSIC_CHOICE_END = 0x1F
const MUSIC_CHOICE_CONFIRM = 0x50
const DIFFICULTY_CHOICE_START = 0x00
const DIFFICULTY_CHOICE_END = 0x05
const DIFFICULTY_CHOICE_CONFIRM = 0x60
const DIFFICULTY_CHOICE_RESPONSE = 0x55

const CLOCKS_30_MS = 30 * 4194304 / 1000


export default class TetrisConnection extends OnlineConnection<TetrisMessage> {

  clockTimer: number = 0

  gameState = new StateMachine<GameStates>(
    { name: "negotiation", negotiationRequested: false },
    { logPrefix: "TETRIS", logStateChanges: true}
  )

  constructor(serialRegisters: SerialRegisters) {
    super(serialRegisters)
  }

  override onReceiveByteFromConsole(byte: number, respond: (byte: number) => void): void {
    if (this.state.name === "disconnected") {
      respond(0xFF)
      return
    }
    if (this.gameState.state.name == "negotiation") {
      if (byte === NEGOTIATION_REQUEST_BYTE) {
        if (!this.gameState.state.negotiationRequested) {
          this.gameState.state.negotiationRequested = true
          this.clockTimer = CLOCKS_30_MS
          this.sendMessage({ type: "negotiation" })
        }
        respond(NEGOTIATION_RESPONSE_BYTE)
      }
      return
    }

    if (this.gameState.state.name === "primary-music-selection") {
      if (byte >= MUSIC_CHOICE_START && byte <= MUSIC_CHOICE_END) {
        if (byte !== this.gameState.state.currentSelection) {
          this.gameState.state.currentSelection = byte
          this.sendMessage({
            type: "music-selection-update",
            selection: byte
          })
        }
        
        respond(0x00)
        return
      }

      if (byte === MUSIC_CHOICE_CONFIRM) {
        this.sendMessage({ type: "music-confirmation" })
        this.gameState.state = {
          name: "primary-difficulty-selection",
          localSelection: 0,
          remoteSelection: 0
        }
      }
    }

    if (this.gameState.state.name === "primary-difficulty-selection") {
      if (byte >= DIFFICULTY_CHOICE_START && byte <= DIFFICULTY_CHOICE_END) {
        if (byte !== this.gameState.state.localSelection) {
          this.gameState.state.localSelection = byte
          this.sendMessage({
            type: "difficultly-selection",
            selection: byte,
          })
        }
        respond(this.gameState.state.remoteSelection)
        return
      }
    }

    console.log(`[TETRIS DEBUG] Uncaught byte ${valueDisplay(byte)} (state: ${this.gameState.state.name})`)
    return
  }

  override receiveMessage(message: TetrisMessage): void {
    console.log("[TETRIS] Received message", message)
    switch(this.gameState.state.name) {
      case "negotiation":
        if (message.type === "negotiation") {
          this.serialRegisters.pushFromExternal(NEGOTIATION_REQUEST_BYTE)
          this.gameState.state = { name: "secondary-music-selection", currentSelection: 0x1C }
          this.clockTimer = CLOCKS_30_MS
        }
        return
      case "secondary-music-selection":
        if (message.type === "music-selection-update") {
          this.gameState.state.currentSelection = message.selection
        }
        if (message.type === "music-confirmation") {
          this.serialRegisters.pushFromExternal(MUSIC_CHOICE_CONFIRM)
          this.clockTimer = CLOCKS_30_MS
          this.gameState.state = {
            name: "secondary-difficulty-selection",
            localSelection: 0,
            remoteSelection: 0
          }
        }
        return
      case "primary-difficulty-selection":
        if (message.type === "difficultly-selection") {
          this.gameState.state.remoteSelection = message.selection
        }
        return
      case "secondary-difficulty-selection":
        if (message.type === "difficultly-selection") {
          this.gameState.state.remoteSelection = message.selection
        }
        return
    }

    console.error(`Incorrect message type ${message.type} in state ${this.gameState.state.name}`)
  }

  override updateClock(cycles: number): void {
    if (this.clockTimer <= 0) { return }

    this.clockTimer -= cycles
    if (this.clockTimer <= 0) {
      if (this.gameState.state.name === "negotiation") {
        if (this.gameState.state.negotiationRequested) {
          this.serialRegisters.responseFromSecondary(NEGOTIATION_RESPONSE_BYTE)
          this.gameState.state = { name: "primary-music-selection", currentSelection: 0x1C }
        }
      }
  
      if (this.gameState.state.name === "secondary-music-selection") {
        this.clockTimer += CLOCKS_30_MS
        this.serialRegisters.pushFromExternal(this.gameState.state.currentSelection)
      }

      if (this.gameState.state.name === "secondary-difficulty-selection") {
        this.clockTimer += CLOCKS_30_MS
        const selection = this.serialRegisters.pushFromExternal(this.gameState.state.remoteSelection)
        if (selection !== this.gameState.state.localSelection) {
          this.gameState.state.localSelection = selection
          this.sendMessage({
            type: "difficultly-selection",
            selection,
          })
        }
      }
    }    
  }
}