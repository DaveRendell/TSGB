import { valueDisplay } from "../../../helpers/displayHexNumbers";
import StateMachine from "../../../helpers/stateMachine";
import SerialRegisters from "../../memory/registers/serialRegisters";
import OnlineConnection from "../onlineConnection";
import GameStates from "./tetrisGameStates";
import { TetrisMessage, parseMessage } from "./tetrisMessages";

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

const ROUND_START_MAGIC_BYTES = [0x30, 0x00, 0x02, 0x02, 0x20]

const PAUSE_BYTE = 0x94
const UNPAUSE_RESPONSE_BYTE = 0xFF 

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
    super(serialRegisters, parseMessage)
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
      if (this.gameState.state.paused) {
        if (byte !== PAUSE_BYTE) {
          this.gameState.state.paused = false
          this.sendMessage({ type: "pause", paused: false })
          respond(UNPAUSE_RESPONSE_BYTE)
        }
      } else {
        if (byte === PAUSE_BYTE) {
          this.gameState.state.paused = true
          this.sendMessage({ type: "pause", paused: true })
          respond(0x00)
        }
        if (byte !== this.gameState.state.lines) {
          this.gameState.state.lines = byte
          this.sendMessage({ type: "lines", lines: byte })
        }
      }
      respond(0x00)
    }

    console.log(`[TETRIS DEBUG] Uncaught byte ${valueDisplay(byte)} (state: ${this.gameState.state.name})`)
    return
  }

  override receiveMessage(message: TetrisMessage): void {
    console.log("[TETRIS] Received message", message)

    if (message.type === "round-data" && message.pieceData.length < 256) {
      console.log(message)
      throw new Error("WTF!")
    }

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
          this.gameState.state = {
            name: "secondary-negotiation-handshake",
            primaryHandshakeByte: DIFFICULTY_CHOICE_CONFIRM,
            secondaryHandshakeByte: DIFFICULTY_CHOICE_RESPONSE,
            nextStateClockStart: CLOCKS_5_MS,
            nextState: {
              name: "secondary-negotiation-handshake",
              primaryHandshakeByte: NEGOTIATION_REQUEST_BYTE,
              secondaryHandshakeByte: NEGOTIATION_RESPONSE_BYTE,
              nextStateClockStart: CLOCKS_5_MS,
              nextState: {
                name: "secondary-receiving-data",
                data: message.lineData,
                nextStateClockStart: CLOCKS_5_MS,
                nextState: {
                  name: "secondary-negotiation-handshake",
                  primaryHandshakeByte: NEGOTIATION_REQUEST_BYTE,
                  secondaryHandshakeByte: NEGOTIATION_RESPONSE_BYTE,
                  nextStateClockStart: CLOCKS_5_MS,
                  nextState: {
                    name: "secondary-receiving-data",
                    data: [...message.pieceData, ...ROUND_START_MAGIC_BYTES],
                    nextStateClockStart: CLOCKS_500_MS,
                    nextState: {
                      name: "secondary-in-game",
                      paused: false,
                      lines: 0,
                      opponentLines: 0
                    }
                  }
                }
              }
            }
          }
        }
        return

      case "secondary-in-game":
        if (message.type === "pause") {
          this.gameState.state.paused = message.paused
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
        this.serialRegisters.pushFromExternal(this.gameState.state.remoteSelection, (selection) => {
          if (this.gameState.state.name === "secondary-difficulty-selection") {
            if (selection !== this.gameState.state.localSelection) {
              this.gameState.state.localSelection = selection
              this.sendMessage({
                type: "difficulty-selection",
                selection,
              })
            }
          }
        })
        
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
            paused: false,
            lines: 0,
            opponentLines: 0
          }
        }
      }

      if (this.gameState.state.name === "secondary-negotiation-handshake") {
        const {
          primaryHandshakeByte,
          secondaryHandshakeByte,
          nextState,
          nextStateClockStart
        } = this.gameState.state
        this.serialRegisters.pushFromExternal(
          primaryHandshakeByte,
          (secondaryResponse) => {
            if (secondaryResponse === secondaryHandshakeByte) {
              this.gameState.state = nextState
              this.clockTimer = nextStateClockStart
            } else {
              this.clockTimer += CLOCKS_5_MS
            }
          })
      }

      if (this.gameState.state.name === "secondary-receiving-data") {
        if (this.serialRegisters.unreadSerialData) {
          this.clockTimer = CLOCKS_5_MS
          return
        }
        if (this.gameState.state.data.length === 0) {
          this.clockTimer = this.gameState.state.nextStateClockStart
          this.gameState.state = this.gameState.state.nextState
          return
        } else {
          const [nextByte] = this.gameState.state.data.splice(0, 1)

          this.serialRegisters.pushFromExternal(nextByte)

          if (this.gameState.state.data.length === 0) {
            this.clockTimer = CLOCKS_30_MS
          } else {
            this.clockTimer = CLOCKS_5_MS
          }        
        }
      }

      if (this.gameState.state.name === "secondary-in-game") {
        if (this.gameState.state.paused) {
          this.serialRegisters.pushFromExternal(PAUSE_BYTE)
        } else {
          const self = this
          const currentState = this.gameState.state
          const currentLines = this.gameState.state.lines
          this.serialRegisters.pushFromExternal(
            this.gameState.state.opponentLines,
            (response) => {
              if (response === 0xFF) { // Ignore this
                return
              }
              if (response !== currentLines) {
                currentState.lines = response
                self.sendMessage({ type: "lines", lines: response})
              }
            })
        }
        this.clockTimer += CLOCKS_5_MS
      }
    }
  }
}