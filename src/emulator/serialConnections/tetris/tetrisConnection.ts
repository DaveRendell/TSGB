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

const DATA_FINISHED = 0x30

const CLOCKS_5_MS = 5 * 4194304 / 1000
const CLOCKS_30_MS = 30 * 4194304 / 1000
const CLOCKS_500_MS = 500 * 4194304 / 1000


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
            type: "difficulty-selection",
            selection: byte,
          })
        }
        respond(this.gameState.state.remoteSelection)
        return
      }

      if (byte === DIFFICULTY_CHOICE_CONFIRM) {
        this.gameState.state = {
          name: "primary-data-handshake",
          started: false
        }

        this.sendMessage({ type: "difficulty-confirmation" })

        respond(DIFFICULTY_CHOICE_RESPONSE)
        return
      }
    }

    if (this.gameState.state.name === "primary-data-handshake") {
      if (byte === NEGOTIATION_REQUEST_BYTE) {
        this.gameState.state.started = true
        this.clockTimer = CLOCKS_30_MS
      }
    }

    if (this.gameState.state.name === "primary-sending-line-data") {
      if (byte === NEGOTIATION_REQUEST_BYTE) {
        console.log("Finished line data", this.gameState.state.dataBuffer.map(valueDisplay))

        this.gameState.state.finished = true
        this.clockTimer = CLOCKS_30_MS
        return
      } else {
        this.gameState.state.dataBuffer.push(byte)
        respond(0x00)
        return
      }
    }

    if (this.gameState.state.name === "primary-sending-piece-data") {
      if (this.gameState.state.finished) {
          console.log("handshaking", byte, this.gameState.state)
          respond([
            0x30, 0x00, 0x44, 0x44,
          ][this.gameState.state.handshakeCounter++] || 0x44)
          if (this.gameState.state.handshakeCounter === 4) {
            this.clockTimer = CLOCKS_500_MS
          }
          return
      }

      if (byte === DATA_FINISHED) {
        console.log("Finished piece data", this.gameState.state.dataBuffer.map(valueDisplay))
        this.sendMessage({
          type: "round-data",
          pieceData: this.gameState.state.dataBuffer,
          lineData: this.gameState.state.lineData,
        })

        this.gameState.state.finished = true
        respond(0x56)
        
        return
      } else {
        this.gameState.state.dataBuffer.push(byte)
        respond(0x00)
        return
      }
    }

    if (this.gameState.state.name === "primary-in-game") {
      respond(0x00)
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
        if (message.type === "difficulty-selection") {
          this.gameState.state.remoteSelection = message.selection
        }
        return

      case "secondary-difficulty-selection":
        if (message.type === "difficulty-selection") {
          this.gameState.state.remoteSelection = message.selection
        }
        if (message.type === "round-data") {
          this.serialRegisters.pushFromExternal(DIFFICULTY_CHOICE_CONFIRM)
          this.gameState.state = {
            name: "secondary-receiving-round-data",
            dataBuffer: [
              DIFFICULTY_CHOICE_CONFIRM,
              NEGOTIATION_REQUEST_BYTE,
              ...message.lineData,
              NEGOTIATION_REQUEST_BYTE,
              ...message.pieceData, 
              0x30, 0x00, 0x02, 0x02, 0x20, // Magic bytes to start the game
            ]
          }
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
            type: "difficulty-selection",
            selection,
          })
        }
      }

      if (this.gameState.state.name === "primary-data-handshake") {
        if (this.gameState.state.started) {
          this.serialRegisters.responseFromSecondary(NEGOTIATION_RESPONSE_BYTE)
          this.gameState.state = {
            name: "primary-sending-line-data",
            dataBuffer: [],
            finished: false,
          }
        }
      }

      if (this.gameState.state.name === "primary-sending-line-data") {
        if (this.gameState.state.finished) {
          this.serialRegisters.responseFromSecondary(NEGOTIATION_RESPONSE_BYTE)
          this.gameState.state = {
            name: "primary-sending-piece-data",
            dataBuffer: [],
            lineData: this.gameState.state.dataBuffer,
            finished: false,
            handshakeCounter: 0,
          }
        }
      }

      if (this.gameState.state.name === "primary-sending-piece-data") {
        if (this.gameState.state.finished) {
          this.serialRegisters.responseFromSecondary(NEGOTIATION_RESPONSE_BYTE)
          this.gameState.state = {
            name: "primary-in-game",
          }
        }
      }

      if (this.gameState.state.name === "secondary-receiving-round-data") {
        if (this.gameState.state.dataBuffer.length === 0) {
          this.gameState.state = {
            name: "secondary-in-game"
          }
        } else {
          const [nextByte] = this.gameState.state.dataBuffer.splice(0, 1)
          this.serialRegisters.pushFromExternal(nextByte)

          this.clockTimer = CLOCKS_30_MS
          // this.gameState.state.dataBuffer.length >= 5
          //   ? CLOCKS_5_MS
          //   : CLOCKS_30_MS

          if (this.gameState.state.dataBuffer.length === 0) {
            // Ready to start game, make sure no pushes for 500ms to avoid freezes
            this.clockTimer = CLOCKS_500_MS
          }
        }
      }
    }    
  }
}