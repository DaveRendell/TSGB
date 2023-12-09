// Reference: https://gbdev.io/pandocs/OAM_DMA_Transfer.html
import { ByteRef } from "../../refs/byteRef"

export class DmaTransferRegister implements ByteRef {
  address: number
  startTransfer: (addr: number) => void = () => {}

  get value(): number { return this.address >> 8 }
  set value(value: number) {
    this.address = value << 8
    this.startTransfer(this.address)
  }
}