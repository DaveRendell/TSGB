import { SerialConnection } from "./serialConnection";

export default class OnlineConnection implements SerialConnection {

  isConnected: boolean;

  constructor() {
    
  }

  onReceiveByteFromConsole(_byte: number): number {
    throw new Error("Method not implemented.");
  }

  updateClock(cycles: number): void {
    throw new Error("Method not implemented.");
  }
}