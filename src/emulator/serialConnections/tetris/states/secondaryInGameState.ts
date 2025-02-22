import TetrisConnection from "../tetrisConnection"
import { TetrisMessage } from "../tetrisMessages"
import TetrisState from "../tetrisState"
import SecondaryRoundEndingState from "./secondaryRoundEndingState"

interface State {
  paused: boolean
  linesBuffer: number
  lines: number
  opponentLines: number
  attackLines: number
}
const PAUSE_BYTE = 0x94
const WON_ROUND_BYTE = 0x77
const LOST_ROUND_BYTE = 0xAA

export default class SecondaryInGameState extends TetrisState {
  state: State
  name = "secondary-in-game"

  constructor(connection: TetrisConnection) {
    super(connection)
    this.state = {
      paused: false,
      linesBuffer: 0,
      lines: 0,
      opponentLines: 0,
      attackLines: 0,
    }
  }

  override onEntry(): void {
    this.connection.setClockMs(500)
  }

  override onReceiveMessage(message: TetrisMessage): void {
    switch (message.type) {
      case "pause":
        this.state.paused = true
        break
      case "lines":
        this.state.opponentLines = message.lines
        break
      case "attack":
        this.state.attackLines = message.size
        break
      case "round-end":
        this.connection.setGameState(
          new SecondaryRoundEndingState(this.connection, message.outcome)
        )
        this.connection.serialRegisters.pushFromExternal(
          message.outcome === "won" ? WON_ROUND_BYTE : LOST_ROUND_BYTE
        )
        break
    }
  }

  override onClockTimeout(): void {
    if (this.state.paused) {
      this.connection.serialRegisters.pushFromExternal(PAUSE_BYTE)
    } else {
      if (this.connection.serialRegisters.unreadSerialData) {
        this.connection.setClockMs(5)
        return
      }

      const handleResponse = (response: number) => {
        if (response === 0x00) { return }

        if (response === WON_ROUND_BYTE) {
          this.connection.sendMessage({
            type: "round-end", outcome: "won"
          })
          this.connection.setGameState(
            new SecondaryRoundEndingState(this.connection)
          )
          return
        }

        if (response === LOST_ROUND_BYTE) {
          this.connection.sendMessage({
            type: "round-end", outcome: "lost"
          })
          this.connection.setGameState(
            new SecondaryRoundEndingState(this.connection)
          )
          return
        }

        if ((response & 0x80) > 0 && response !== 0xFF) {
          this.connection.sendMessage({
            type: "attack", size: response & 0xF
          })
          return
        }

        if (response === 0xFF) {
          this.state.attackLines = 0
          if (this.state.linesBuffer !== this.state.lines) {
            this.state.lines = this.state.linesBuffer
            this.connection.sendMessage({
              type: "lines", lines: this.state.lines
            })
          }
          return
        }
        this.state.linesBuffer = response
      }

      if (this.state.attackLines > 0) {
        this.connection.serialRegisters.pushFromExternal(
          0x80 + this.state.attackLines,
          handleResponse
        )
      } else {
        this.connection.serialRegisters.pushFromExternal(
          this.state.opponentLines,
          handleResponse
        )
      }
    }
    this.connection.setClockMs(5)
  }
}