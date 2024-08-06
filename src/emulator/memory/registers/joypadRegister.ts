import { valueDisplay } from "../../../helpers/displayHexNumbers"
import { EmulatorMode } from "../../emulator"
import { ByteRef } from "../../refs/byteRef"
import SuperEmulator from "../../super/superEmulator"

// Reference: https://gbdev.io/pandocs/Joypad_Input.html#ff00--p1joyp-joypad
export class JoypadRegister implements ByteRef {
  mode: EmulatorMode
  superEmulator?: SuperEmulator
  multiplayerNibble = 0xE

  A = false
  B = false
  Start = false
  Select = false
  Up = false
  Down = false
  Left = false
  Right = false

  selectButtons = true
  selectDpad = true

  // SGB transfer variables
  receivingData = false
  byteToSend: number = 0
  bitCounter: number = 0
  byteBuffer: number[] = []

  constructor(mode: EmulatorMode, superEmulator?: SuperEmulator) {
    this.mode = mode
    this.superEmulator = superEmulator
  }

  get byte() {
    const upperNibble =
      0xc0 + (this.selectButtons ? 0x20 : 0) + (this.selectDpad ? 0x10 : 0)

    if (this.selectButtons && this.selectDpad && this.mode === EmulatorMode.SGB) {
      return upperNibble + this.multiplayerNibble
    }

    if (this.selectButtons) {
      return upperNibble + this.buttonNibble()
    }

    if (this.selectDpad) {
      return upperNibble + this.dpadNibble()
    }

    return upperNibble + 0xf
  }

  set byte(value: number) {
    if (this.mode === EmulatorMode.SGB) {
      if ((value & 0x20) > 0 && !this.selectDpad) {
        // Toggle returned controller to make games believe they're running on SGB
        this.multiplayerNibble = this.multiplayerNibble === 0xE ? 0xF : 0xE
      }
    }

    this.selectButtons = (value & 0x10) > 0
    this.selectDpad = (value & 0x20) > 0

    if (this.mode === EmulatorMode.SGB && this.superEmulator) {
      // https://gbdev.io/pandocs/SGB_Command_Packet.html

      const bit4 = (value >> 4) & 1
      const bit5 = (value >> 5) & 1

      if (!bit4 && !bit5) {
        // START
        this.byteToSend = 0
        this.bitCounter = 0
        this.byteBuffer = []
        this.receivingData = true
      }

      if (this.receivingData && bit4 && !bit5) {
        // 1 bit received
        this.byteToSend |= (1 << this.bitCounter++)
        
        if (this.byteBuffer.length === 16) {
          // We're not really receiving data, shut it off
          this.byteBuffer = []
        }
      }

      if (this.receivingData && !bit4 && bit5) {
        // 0 bit received
        if (this.byteBuffer.length === 16) {
          this.superEmulator.receivePacket(this.byteBuffer)
          this.byteBuffer = []
        }
        this.bitCounter++
      }
      if (this.bitCounter === 8) {
        // TODO send byte to SGB emulation
        this.byteBuffer.push(this.byteToSend)
        this.byteToSend = 0
        this.bitCounter = 0
      }
    }
  }

  private buttonNibble(): number {
    return (
      (this.Start ? 0 : 0x8) +
      (this.Select ? 0 : 0x4) +
      (this.B ? 0 : 0x2) +
      (this.A ? 0 : 0x1)
    )
  }

  private dpadNibble(): number {
    return (
      (this.Down ? 0 : 0x8) +
      (this.Up ? 0 : 0x4) +
      (this.Left ? 0 : 0x2) +
      (this.Right ? 0 : 0x1)
    )
  }
}
