import { ByteRef } from "../../refs/byteRef"
import { DebugConnection } from "../../serialConnections/debugConnection"
import { PrinterConnection } from "../../serialConnections/printerConnection"
import { SerialConnection } from "../../serialConnections/serialConnection"
import { SerialPort } from "../../serialConnections/serialPort"
import { Interrupt, InterruptRegister } from "./interruptRegisters"


export default class SerialRegisters {
  data: number = 0
  transferEnabled: boolean = false
  isPrimary: boolean = false

  sendByte: (_: number) => void

  interruptRegister: InterruptRegister

  serialDataRegister: ByteRef
  serialControlRegister: ByteRef

  serialPort: SerialPort

  constructor(serialPort: SerialPort, interruptRegister: InterruptRegister) {
    this.serialPort = serialPort
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
          self.serialPort.connection.onReceiveByteFromConsole(self.data, (byte) => {
            self.responseFromSecondary(byte)
          })
        }
      }
    }
  }

  responseFromSecondary(byte: number): void {
    this.data = byte
    this.transferEnabled = false
    this.interruptRegister.setInterrupt(Interrupt.Serial)
  }

  // called when this console is the secondary console, and the primary is
  // starting a transfer
  pushFromExternal(externalByte: number): number {
    if (this.isPrimary) {
      // If we're primary, don't let the other console push
      return externalByte
    }
    const previousDataValue = this.data
    this.data = externalByte
    this.interruptRegister.setInterrupt(Interrupt.Serial)
    return previousDataValue
  }
}