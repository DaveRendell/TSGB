import { SerialConnection } from "./serialConnection";

export class DebugConnection implements SerialConnection {
  onReceiveByteFromConsole(byte: number): number {
    console.log("[SERIAL PORT]: ", "0x" + byte.toString(16).padStart(2, "0"))
    return 0xFF
  }
  isConnected: boolean = false
}