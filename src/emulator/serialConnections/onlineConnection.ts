import Peer, { DataConnection } from "peerjs"
import StateMachine from "../../helpers/stateMachine"
import { SerialConnection } from "./serialConnection"
import SerialRegisters from "../memory/registers/serialRegisters"
import GameState from "./gameState"


interface DisconnectedState {
  name: "disconnected"
}

interface ConnectedState {
  name: "connected"
  connection: DataConnection
}

type ConnectionState = DisconnectedState | ConnectedState

export default class OnlineConnection<
  MessageType,
  GameStateType extends GameState<MessageType>
> extends StateMachine<ConnectionState> implements SerialConnection {
  isConnected: boolean = false;
  peer: Peer
  serialRegisters: SerialRegisters
  gameState: GameStateType
  clockTimer = 0
  connectedCallback: () => void = () => {}
  parseMessage: (raw: any) => MessageType

  constructor(
    serialRegisters: SerialRegisters,
    initialGameStateFactory: (self: OnlineConnection<MessageType, GameStateType>) => GameStateType,
    parseMessage: (raw: any) => MessageType
  ) {
    super(
      { name: "disconnected" },
      { logPrefix: "ONLINE", logStateChanges: true }
    )
    this.parseMessage = parseMessage
    this.serialRegisters = serialRegisters
    this.peer = new Peer()
    this.peer.on("connection", (connection) => {
      const self = this
      connection.on("data", (data) => self.receiveMessage(parseMessage(data)))
      this.state = { name: "connected", connection }
      this.connectedCallback()
    })
    this.gameState = initialGameStateFactory(this)
    this.gameState.onEntry()
  }

  onReceiveByteFromConsole(byte: number, respond: (byte: number) => void): void {
    this.gameState.onReceiveByteFromConsole(byte, respond)
  }

  updateClock(cycles: number): void {
    if (this.clockTimer <= 0) { return }
    this.clockTimer -= cycles
    if (this.clockTimer <= 0) {
      this.gameState.onClockTimeout()
    }
  }

  sendMessage(message: MessageType): void {
    if (this.state.name === "disconnected") {
      throw new Error("Attempted to send message while disconnected")
    }
    console.log("[ONLINE] Sending message", message)
    this.state.connection.send(message)
  }

  receiveMessage(message: MessageType): void{
    console.log("[ONLINE] Receiving message", message)
    this.gameState.onReceiveMessage(message)
  }

  setGameState(newState: GameStateType) {
    this.gameState = newState
    this.gameState.onEntry()
  }

  setClockMs(milliseconds: number) {
    this.clockTimer = milliseconds * 4194304 / 1000
  }

  async setupConnection(connectionId: string): Promise<void> {
    const connection = this.peer.connect(connectionId)

    return new Promise((resolve, reject) => {
      connection.on("open", () => {
        this.state = { name: "connected", connection }
        const self = this
        connection.on("data", (data) => {
          self.receiveMessage(this.parseMessage(data))
        })
        resolve()
      })
      connection.on("error", reject)
    })
  }
}