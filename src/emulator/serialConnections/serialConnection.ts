export interface SerialConnection {
  onReceiveByteFromConsole(byte: number, respond: (byte: number) => void)
  isConnected: boolean
  updateClock(cycles: number): void
}