import { SerialConnection } from "./serialConnection";

export class DebugConnection implements SerialConnection {
  onReceiveByteFromConsole(byte: number) {
    console.log("[SERIAL PORT]: ", "0x" + byte.toString(16).padStart(2, "0"))
  }
  isConnected: boolean = false
  updateClock(cycles: number): void {}
}