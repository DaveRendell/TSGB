export interface SerialConnection {
  onReceiveByteFromConsole(byte: number): number
  isConnected: boolean
  updateClock(cycles: number): void
}