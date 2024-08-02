import OnlineConnection from "../onlineConnection";

export default class TetrisConnection extends OnlineConnection {

  constructor() {
    super()
  }

  override onReceiveByteFromConsole(_byte: number): number {
    throw new Error("Method not implemented.");
  }

  override updateClock(cycles: number): void {
    throw new Error("Method not implemented.");
  }
}