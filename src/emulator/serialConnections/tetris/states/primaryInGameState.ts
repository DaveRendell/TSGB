import TetrisConnection from "../tetrisConnection"
import { TetrisMessage } from "../tetrisMessages"
import TetrisState from "../tetrisState"
import PrimaryRoundEndingState from "./primaryRoundEndingState"

interface State {
  paused: boolean
  lines: number
  opponentLines: number
  attackLines: number
}
const PAUSE_BYTE = 0x94
const UNPAUSE_RESPONSE_BYTE = 0xFF
const WON_ROUND_BYTE = 0x77
const LOST_ROUND_BYTE = 0xAA

export default class PrimaryInGameState extends TetrisState {
  state: State
  name =  "primary-in-game"

  constructor(connection: TetrisConnection) {
    super(connection)
    this.state = {
      paused: false,
      lines: 0,
      opponentLines: 0,
      attackLines: 0,
    }
  }

  override onEntry(): void {
    
  }

  override onReceiveByteFromConsole(
    byte: number,
    respond: (response: number) => void
  ): void {
    if (this.state.paused) {
      if (byte !== PAUSE_BYTE) {
        this.state.paused = false
        this.connection.sendMessage({
          type: "pause", paused: false
        })
        respond(UNPAUSE_RESPONSE_BYTE)
        return
      }
    } else {
      if (byte === PAUSE_BYTE) {
        this.state.paused = true
        this.connection.sendMessage({
          type: "pause", paused: true
        })
        respond(0x00)
        return
      }
    }

    if (byte === WON_ROUND_BYTE) {
      this.connection.sendMessage({
        type: "round-end", outcome: "won"
      })
      this.connection.roundsWon++
      respond(this.state.opponentLines)
      this.connection.setGameState(
        new PrimaryRoundEndingState(this.connection)
      )
      return
    }

    if (byte == LOST_ROUND_BYTE) {
      this.connection.sendMessage({
        type: "round-end", outcome: "lost"
      })
      this.connection.opponentRoundsWon++
      respond(this.state.opponentLines)
      this.connection.setGameState(
        new PrimaryRoundEndingState(this.connection)
      )
      return
    }

    if (byte != this.state.lines) {
      if (byte & 0x80) {
        this.connection.sendMessage({
          type: "attack", size: byte & 0xF
        })
      } else {
        this.state.lines = byte
        this.connection.sendMessage({
          type: "lines", lines: byte
        })
      }
    }
    if (this.state.attackLines > 0) {
      respond(0x80 + this.state.attackLines)
      this.state.attackLines = 0
      return
    }
    respond(this.state.opponentLines)
  }

  override onReceiveMessage(message: TetrisMessage): void {
    switch(message.type) {
      case "lines":
        this.state.opponentLines = message.lines
        break
      case "attack":
        this.state.attackLines = message.size
        break
      case "round-end":
        this.connection.setGameState(
          new PrimaryRoundEndingState(this.connection, message.outcome)
        )
        if (message.outcome === "won") {
          this.connection.opponentRoundsWon++
        } else {
          this.connection.roundsWon++
        }
        break
    }
  }
}