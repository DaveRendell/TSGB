import Peer, { DataConnection } from "peerjs"
import StateMachine from "../../helpers/stateMachine"
import { SerialConnection } from "./serialConnection"


interface DisconnectedState {
  name: "disconnected"
}

interface ConnectedState {
  name: "connected"
  connection: DataConnection
}

type ConnectionState = DisconnectedState | ConnectedState

export default class OnlineConnection extends StateMachine<ConnectionState> implements SerialConnection  {
  isConnected: boolean = false;
  peer: Peer
  connectedCallback: () => void = () => {}

  constructor() {
    super({ name: "disconnected" })
    this.peer = new Peer()
    this.peer.on("connection", (connection) => {
      this.state = { name: "connected", connection }
      this.connectedCallback()
    })
  }

  onReceiveByteFromConsole(_byte: number): number {
    throw new Error("Method not implemented.");
  }

  updateClock(cycles: number): void {
    throw new Error("Method not implemented.");
  }

  async setupConnection(connectionId: string): Promise<void> {
    const connection = this.peer.connect(connectionId)

    return new Promise((resolve, reject) => {
      connection.on("open", () => {
        this.state = { name: "connected", connection }
        resolve()
      })
      connection.on("error", reject)
    })
  }
}