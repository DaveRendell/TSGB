import { ByteRef, GetSetByteRef } from "../../refs/byteRef"
import { Cartridge, StoreRam } from "./cartridge"

const RAM_WRITE_WAIT_MILLISECONDS = 500

// Reference: https://gbdev.io/pandocs/MBC5.html
export class Mbc5Cartridge extends Cartridge {
  ramAndRtcEnabled = false
  bankNumber1 = 1
  bankNumber2 = 0
  bankingMode: "simple" | "advanced" = "simple"

  constructor(data: Uint8Array, storeRam: StoreRam, loadedSave?: Uint8Array) {
    super(data, storeRam, loadedSave)
  }

  override rom(address: number): ByteRef {
    const read = () => {
      if (address < 0x4000) {
        return this.romData[address]
      }
      const adjustedAddress = address + ((this.bankNumber1 - 1) << 14)
      return this.romData[adjustedAddress]
    }
    let write: (value: number) => void

    if (address < 0x2000) {
      // Set RAM enabled register
      write = (value: number) => {
        this.ramAndRtcEnabled = (value & 0xf) == 0xa
      }
    } else if (address < 0x3000) {
      write = (value: number) => {
        this.bankNumber1 &= 0x100
        this.bankNumber1 |= value
      }
    } else if (address < 0x4000) {
      write = (value: number) => {
        this.bankNumber1 &= 0xff
        this.bankNumber1 |= (value & 0x1) << 8
      }
    } else if (address < 0x6000) {
      write = (value: number) => {
        this.bankNumber2 = value & 0xf
      }
    } else {
      // Latch clock - TODO
      write = () => {}
    }

    return new GetSetByteRef(read, write)
  }

  private writeToRam(address: number, value: number) {
    const bankBase = this.bankNumber2 << 13
    this.ramData[address - 0xa000 + bankBase] = value
    if (this.ramWriteTimeout) {
      clearTimeout(this.ramWriteTimeout)
    }
    this.ramWriteTimeout = setTimeout(
      () => {
        this.storeRam(this.ramData)
        this.ramWriteTimeout = undefined
      },
      RAM_WRITE_WAIT_MILLISECONDS,
    )
  }

  override ram(address: number): ByteRef {
    return new GetSetByteRef(
      () => {
        const bankBase = this.bankNumber2 << 13
        return this.ramData[address - 0xa000 + bankBase]
      },
      (value) => this.writeToRam(address, value),
    )
  }
}
