import Peer, { DataConnection } from "peerjs"
import StateMachine from "../../helpers/stateMachine"
import { SerialConnection } from "./serialConnection"
import SerialRegisters from "../memory/registers/serialRegisters"


interface DisconnectedState {
  name: "disconnected"
}

interface ConnectedState {
  name: "connected"
  connection: DataConnection
}

type ConnectionState = DisconnectedState | ConnectedState

export default class OnlineConnection<MessageType> extends StateMachine<ConnectionState> implements SerialConnection {
  isConnected: boolean = false;
  peer: Peer
  serialRegisters: SerialRegisters
  connectedCallback: () => void = () => {}
  parseMessage: (raw: any) => MessageType

  constructor(serialRegisters: SerialRegisters, parseMessage: (raw: any) => MessageType) {
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
  }

  onReceiveByteFromConsole(_byte: number, respond: (byte: number) => void): void {
    throw new Error("Method not implemented.");
  }

  updateClock(cycles: number): void {
    throw new Error("Method not implemented.");
  }

  sendMessage(message: MessageType): void {
    if (this.state.name === "disconnected") {
      throw new Error("Attempted to send message while disconnected")
    }
    console.log("[ONLINE] Sending message", message)
    this.state.connection.send(message)
  }

  receiveMessage(message: MessageType): void{
    throw new Error("Method not implemented.");
  }

  async setupConnection(connectionId: string): Promise<void> {
    const connection = this.peer.connect(connectionId)

    return new Promise((resolve, reject) => {
      connection.on("open", () => {
        this.state = { name: "connected", connection }
        const self = this
        connection.on("data", (data) => self.receiveMessage(this.parseMessage(data)))
        resolve()
      })
      connection.on("error", reject)
    })
  }
}