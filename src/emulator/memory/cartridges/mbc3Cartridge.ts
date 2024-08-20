import { ByteRef, GetSetByteRef } from "../../refs/byteRef"
import { Cartridge, StoreRam } from "./cartridge"
import { Rtc, updateRtc } from "./realTimeClock/rtc"

const RAM_WRITE_WAIT_MILLISECONDS = 500

// Reference: https://gbdev.io/pandocs/MBC3.html
export class Mbc3Cartridge extends Cartridge {
  ramAndRtcEnabled = false
  bankNumber1 = 1
  bankNumber2 = 0
  bankingMode: "simple" | "advanced" = "simple"

  rtc: Rtc
  latchedRtc: Rtc = {
    seconds: 0,
    minutes: 0,
    hours: 0,
    days: 0,
    halt: false,
    carry: false,
    savedAt: new Date()
  }
  latchRegister: number = 1
  writeRtc: (rtc: Rtc) => void
  rtcWriteTimeout: NodeJS.Timeout = undefined

  constructor(
    data: Uint8Array,
    storeRam: StoreRam,
    loadedSave: Uint8Array,
    rtc: Rtc | undefined,
    writeRtc: (rtc: Rtc) => void
  ) {
    super(data, storeRam, loadedSave)
    this.rtc = rtc || {...this.latchedRtc}
    this.writeRtc = writeRtc
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
    } else if (address < 0x4000) {
      write = (value: number) => {
        this.bankNumber1 = value & 0x7f
        if (this.bankNumber1 == 0) {
          this.bankNumber1 = 1
        }
      }
    } else if (address < 0x6000) {
      write = (value: number) => {
        this.bankNumber2 = value
      }
    } else {
      // Latch clock - TODO
      write = (value) => {
        if (this.latchRegister == 0 && value == 1) {
          this.latchedRtc = updateRtc(this.rtc)
        }
        this.latchRegister = value
      }
    }

    return new GetSetByteRef(read, write)
  }

  private writeToRam(address: number, value: number) {
    const bankBase = this.bankNumber2 << 13
    this.ramData[address - 0xa000 + bankBase] = value
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
  }

  override ram(address: number): ByteRef {
    return new GetSetByteRef(
      () => {
        if (this.bankNumber2 <= 3) {
          const bankBase = this.bankNumber2 << 13
          return this.ramData[address - 0xa000 + bankBase]
        } else if (this.bankNumber2 >= 8) {
          switch (this.bankNumber2) {
            case 0x8: return this.latchedRtc.seconds || 0
            case 0x9: return this.latchedRtc.minutes || 0
            case 0xa: return this.latchedRtc.hours || 0
            case 0xb: return (this.latchedRtc.days & 0xff) || 0
            case 0xc: return (this.latchedRtc.days >> 8)
              + (this.latchedRtc.halt ? 0x40 : 0)
              + (this.latchedRtc.carry ? 0x80 : 0)
            default: return 0xff
          }
        }
      },
      (value) => {
        if (this.bankNumber2 <= 3) {
          this.writeToRam(address, value)
        } else if (this.bankNumber2 >= 8) {
          if (this.rtcWriteTimeout) {
            return
          }
          this.rtcWriteTimeout = setTimeout(
            () => {
              const newRtc = updateRtc(this.rtc)
              switch (this.bankNumber2) {
                case 0x8: newRtc.seconds = value; break
                case 0x9: newRtc.minutes = value; break
                case 0xa: newRtc.hours = value; break
                case 0xb:
                  newRtc.days &= 0x1ff
                  newRtc.days |= value
                  break
                case 0xc:
                  newRtc.days &= 0xFF
                  newRtc.days |= ((value & 1) << 8)
                  newRtc.halt = (value & 0x40) > 0
                  newRtc.carry = (value & 0x80) > 0
                  break
              }
              console.log("Writing to RTC", this.rtc, newRtc, this.bankNumber2.toString(16), value.toString(16).padStart(2, "0"))
              this.rtc = newRtc
              this.writeRtc(newRtc)
              this.rtcWriteTimeout = undefined
            },
            2500
          )
        }
      },
    )
  }

  override romBank(address: number): number {
    if (address < 0x4000) { return 0 }
    return this.bankNumber1
  }

  override ramBank(_address: number): number {
    return this.bankNumber2
  }
}
