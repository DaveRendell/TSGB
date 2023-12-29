import { ByteRef, GetSetByteRef } from "../../refs/byteRef";
import { Cartridge } from "./cartridge";

const RAM_WRITE_WAIT_MILLISECONDS = 500

// Reference: https://gbdev.io/pandocs/MBC1.html
export class Mbc3Cartridge extends Cartridge {
  ramAndRtcEnabled = false
  bankNumber1 = 1
  bankNumber2 = 0
  bankingMode: "simple" | "advanced" = "simple"

  constructor(data: Uint8Array) {
    super(data)
  }

  override rom(address: number): ByteRef {
    const read = () => {
      if (address < 0x4000) { return this.romData[address] }
      const adjustedAddress = address + (this.bankNumber1 - 1) * 0x4000
      return this.romData[adjustedAddress]
    }
    let write: (value: number) => void

    if (address < 0x2000) {
      // Set RAM enabled register
      write = (value: number) => {
        this.ramAndRtcEnabled = (value & 0xF) == 0xA
      }
    } else if (address < 0x4000) {
      write = (value: number) => {
        this.bankNumber1 = value & 0x7F
        if (this.bankNumber1 == 0) { this.bankNumber1 = 1 }
      }
    } else if (address < 0x6000) {
      write = (value: number) => {
        this.bankNumber2 = value
      }
    } else {
      // Latch clock - TODO
      write = () => {}
    }

    return new GetSetByteRef(read, write)
  }

  private writeToRam(address: number, value: number) {
    const bankBase = 0x2000 * this.bankNumber2 
    this.ramData[(address - 0xA000) + bankBase] = value
    if (this.ramWriteTimeout) { clearTimeout(this.ramWriteTimeout) }
    this.ramWriteTimeout = setTimeout(this.storeRam, RAM_WRITE_WAIT_MILLISECONDS)
  }

  override ram(address: number): ByteRef {
    return new GetSetByteRef(
      () => {
        const bankBase = 0x2000 * this.bankNumber2 
        return this.ramData[(address - 0xA000) + bankBase]
      },
      (value) => this.writeToRam(address, value)
    )
  }
}