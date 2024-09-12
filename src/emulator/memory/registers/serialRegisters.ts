import { valueDisplay } from "../../../helpers/displayHexNumbers"
import { ByteRef } from "../../refs/byteRef"
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

  // Used if a transfer is queued  by primary but secondary hasn't enabled transfers
  dataBuffer: number | undefined = undefined

  unreadSerialData: boolean = false

  constructor(serialPort: SerialPort, interruptRegister: InterruptRegister) {
    this.serialPort = serialPort
    this.interruptRegister = interruptRegister
    this.sendByte = () => {}
    const self = this
    this.serialDataRegister = {
      get byte() {
        self.unreadSerialData = false
        return self.data
      },
      set byte(value) {
        self.data = value
      }
    }
    this.serialControlRegister = {
      get byte() {
        return (self.transferEnabled ? 0x80 : 0) + (self.isPrimary ? 1 : 0)
      },
      set byte(value) {
        self.transferEnabled = (value & 0x80) > 0
        self.isPrimary = (value & 1) > 0
        if (self.transferEnabled && self.isPrimary) {
          self.serialPort.connection.onReceiveByteFromConsole(self.data, (byte) => {
            self.responseFromSecondary(byte)
          })
        }
        if (self.transferEnabled && !self.isPrimary && this.dataBuffer !== undefined) {
          self.pushFromExternal(self.dataBuffer, () => {})
          self.dataBuffer = undefined
        }
      }
    }
  }

  responseFromSecondary(byte: number): void {
    this.data = byte
    this.unreadSerialData = true
    this.transferEnabled = false
    this.interruptRegister.setInterrupt(Interrupt.Serial)
  }

  // called when this console is the secondary console, and the primary is
  // starting a transfer
  pushFromExternal(externalByte: number, respond: (value: number) => void = () => {}): void {
    if (this.isPrimary) {
      // If we're primary, don't let the other console push
      return respond(externalByte)
    }
    if (this.transferEnabled) {
      const previousDataValue = this.data
      this.data = externalByte
      this.unreadSerialData = true
      this.interruptRegister.setInterrupt(Interrupt.Serial)
      return respond(previousDataValue)
    }

    this.dataBuffer = externalByte
  }
}