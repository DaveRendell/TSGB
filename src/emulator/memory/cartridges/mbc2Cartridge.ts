import { ByteRef, GetSetByteRef } from "../../refs/byteRef"
import { Cartridge, StoreRam } from "./cartridge"

const RAM_WRITE_WAIT_MILLISECONDS = 500

// Reference: https://gbdev.io/pandocs/MBC2.html
export class Mbc2Cartridge extends Cartridge {
  ramEnabled = false
  bankNumber = 1
  romBanks = 0
  onchipRam = new Uint8Array(512)

  constructor(data: Uint8Array, storeRam: StoreRam, loadedSave?: Uint8Array) {
    super(data, storeRam, loadedSave)
    this.romBanks = 1 << (data[0x0148] + 1)
    if (loadedSave) { this.onchipRam = loadedSave }
  }

  override rom(address: number): ByteRef {
    let read: () => number

    if (address < 0x4000) {
      read = () =>  {
        return this.romData[address]
      }
    } else {
      read = () => {
        const adjustedAddress = (address & 0x3fff) + (this.bankNumber << 14)
        return this.romData[adjustedAddress]
      }
    }
    let write: (value: number) => void

    // If bit 8 is set, writes control selected ROM bank. Otherwise, writes
    // enable or disable RAM
    if ((address & 0x0100) > 0) {
      write = (value) => {
        this.bankNumber = (value & 0x0F) || 1
      }
    } else {
      write = (value) => {
        this.ramEnabled = value === 0x0A
      }
    }

    return new GetSetByteRef(read, write)
  }

  override ram(address: number): ByteRef {
    return new GetSetByteRef(
      () => (this.onchipRam[0xA000 + (address & 0x01FF)] & 0x0F),
      (value) => this.onchipRam[0xA000 + (address & 0x01FF)] = (value & 0x0F)
    )
  }
  
  override romBank(address: number): number {
    if (address < 0x4000) { return 0 }
    return this.bankNumber
  }

  override ramBank(_address: number): number {
    return 0
  }
}
