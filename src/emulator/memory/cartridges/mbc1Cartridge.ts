import { ByteRef, GetSetByteRef } from "../../refs/byteRef"
import { Cartridge, StoreRam } from "./cartridge"

const RAM_WRITE_WAIT_MILLISECONDS = 500

// Reference: https://gbdev.io/pandocs/MBC1.html
export class Mbc1Cartridge extends Cartridge {
  ramEnabled = false
  bankNumber1 = 1
  bankNumber2 = 0
  advancedMode = false
  romBanks = 0
  ramBanks = 0

  constructor(data: Uint8Array, storeRam: StoreRam, loadedSave?: Uint8Array) {
    super(data, storeRam, loadedSave)
    this.romBanks = 1 << (data[0x0148] + 1)
    this.ramBanks = [0, 0, 1, 4, 16, 8][data[0x149]]
  }

  override rom(address: number): ByteRef {
    let read: () => number

    if (address < 0x4000) {
      read = () =>  {
        if (!this.advancedMode) {
          return this.romData[address]
        }
        const bankNumber = (this.bankNumber2 << 5) & (this.romBanks - 1)
        const adjustedAddress = (address & 0x3fff) + (bankNumber << 14)
        return this.romData[adjustedAddress]
      }
    } else {
      read = () => {
        const bankNumber = ((this.bankNumber2 << 5) + this.bankNumber1) & (this.romBanks - 1)
        const adjustedAddress = (address & 0x3fff) + (bankNumber << 14)
        return this.romData[adjustedAddress]
      }
    }
    let write: (value: number) => void

    if (address < 0x2000) {
      // Set RAM enabled register
      write = (value: number) => {
        this.ramEnabled = (value & 0xf) == 0xa
      }
    } else if (address < 0x4000) {
      write = (value: number) => {
        this.bankNumber1 = value & 0x1f
        if (this.bankNumber1 == 0) {
          this.bankNumber1 = 1
        }
      }
    } else if (address < 0x6000) {
      write = (value: number) => {
        this.bankNumber2 = value & 0x3
      }
    } else {
      write = (value: number) => {
        this.advancedMode = (value & 1) > 0
      }
    }

    return new GetSetByteRef(read, write)
  }

  override ram(address: number): ByteRef {
    return new GetSetByteRef(
      () => {
        if (!this.ramEnabled) { return 0xff }
        if (this.advancedMode) {
          const bank = this.bankNumber2 & (this.ramBanks - 1)
          return this.ramData[(address & 0x1fff) + (bank << 13)]
        }
        return this.ramData[address & 0x1fff]
      },
      (value) => {
        if (!this.ramEnabled) { return }
        const ramAddress = this.advancedMode
          ? (address & 0x1fff) + ((this.bankNumber2 & (this.ramBanks - 1)) << 13)
          : address & 0x1fff
        this.ramData[ramAddress] = value
        if (this.ramWriteTimeout) {
          return
        }
        this.ramWriteTimeout = setTimeout(
          () => {
            this.storeRam(this.ramData)
            this.ramWriteTimeout = undefined
          },
          RAM_WRITE_WAIT_MILLISECONDS,
        )
      },
    )
  }

  override romBank(address: number): number {
    if (address < 0x4000) {
      if (!this.advancedMode) { return 0 }
      return (this.bankNumber2 << 5) & (this.romBanks - 1)
    }
    return ((this.bankNumber2 << 5) + this.bankNumber1) & (this.romBanks - 1)
  }

  override ramBank(_address: number): number {
    if (this.advancedMode) {
      return this.bankNumber2 & (this.ramBanks - 1)
    }
    return 0
  }
}
