import OnlineConnection from "../onlineConnection";

export default class TetrisConnection extends OnlineConnection {

  constructor() {
    super()
  }

  override onReceiveByteFromConsole(_byte: number): number {
    return 0xFF
  }

  override updateClock(cycles: number): void {
  }
}