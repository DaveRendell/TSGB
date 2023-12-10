import { ByteRef, GetSetByteRef } from "../../refs/byteRef";
import { Cartridge } from "./cartridge";

// Reference: https://gbdev.io/pandocs/MBC1.html
export class Mbc1Cartridge extends Cartridge {
  ramEnabled = false
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
        this.ramEnabled = (value & 0xF) == 0xA
      }
    } else if (address < 0x4000) {
      write = (value: number) => {
        this.bankNumber1 = value & 0x1F
        if (this.bankNumber1 == 0) { this.bankNumber1 = 1 }
      }
    } else if (address < 0x6000) {
      write = (value: number) => {
        this.bankNumber2 = value & 0x3
      }
    } else {
      write = (value: number) => {
        this.bankingMode = (value & 1) > 0 ? "advanced" : "simple"
      }
    }

    return new GetSetByteRef(read, write)
  }
}