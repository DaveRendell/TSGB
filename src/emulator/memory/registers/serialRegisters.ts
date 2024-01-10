import { ByteRef } from "../../refs/byteRef"
import { Interrupt, InterruptRegister } from "./interruptRegisters"


export default class SerialRegisters {
  data: number = 0
  lastReceivedByte: number | undefined
  transferEnabled: boolean = false
  isPrimary: boolean = false

  sendByte: (_: number) => void

  interruptRegister: InterruptRegister

  serialDataRegister: ByteRef
  serialControlRegister: ByteRef

  constructor(interruptRegister: InterruptRegister) {
    this.interruptRegister = interruptRegister
    this.sendByte = () => {}
    const self = this
    this.serialDataRegister = {
      get byte() { return self.data },
      set byte(value) {
        self.data = value
        if (!self.isPrimary && self.transferEnabled) {
          self.sendByte(value)
        }
      }
    }
    this.serialControlRegister = {
      get byte() {
        return (self.transferEnabled ? 0x80 : 0) + (self.isPrimary ? 1 : 0)
      },
      set byte(value) {
        self.transferEnabled = (value & 0x80) > 0
        self.isPrimary = (value & 1) > 0
        if (self.transferEnabled) {
          self.sendByte(self.data)
          if (self.isPrimary && self.lastReceivedByte) {
            self.data = self.lastReceivedByte
            this.lastReceivedByte = undefined
            self.transferEnabled = false
            interruptRegister.setInterrupt(Interrupt.Serial)
          }
        }
      }
    }
  }

  onReceiveByte(byte: number): void {
    if (!this.isPrimary || this.transferEnabled) {
      this.data = byte
      this.lastReceivedByte = undefined
      this.transferEnabled = false
      this.interruptRegister.setInterrupt(Interrupt.Serial)

      if (this.isPrimary) {
        this.sendByte(this.data)
      }
    }
  }
}