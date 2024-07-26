import { ByteRef } from "../../refs/byteRef"
import { DebugConnection } from "../../serialConnections/debugConnection"
import { SerialConnection } from "../../serialConnections/serialConnection"
import { Interrupt, InterruptRegister } from "./interruptRegisters"


export default class SerialRegisters {
  data: number = 0
  transferEnabled: boolean = false
  isPrimary: boolean = false

  sendByte: (_: number) => void

  interruptRegister: InterruptRegister

  serialDataRegister: ByteRef
  serialControlRegister: ByteRef

  serialConnection: SerialConnection = new DebugConnection()

  constructor(interruptRegister: InterruptRegister) {
    this.interruptRegister = interruptRegister
    this.sendByte = () => {}
    const self = this
    this.serialDataRegister = {
      get byte() { return self.data },
      set byte(value) { self.data = value }
    }
    this.serialControlRegister = {
      get byte() {
        return (self.transferEnabled ? 0x80 : 0) + (self.isPrimary ? 1 : 0)
      },
      set byte(value) {
        self.transferEnabled = (value & 0x80) > 0
        self.isPrimary = (value & 1) > 0
        if (self.transferEnabled) {
          self.data = self.serialConnection.onReceiveByteFromConsole(self.data)
          self.transferEnabled = false
          self.interruptRegister.setInterrupt(Interrupt.Serial)
        }
      }
    }
  }
}