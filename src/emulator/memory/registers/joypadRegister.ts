import { ByteRef } from "../../refs/byteRef"

// Reference: https://gbdev.io/pandocs/Joypad_Input.html#ff00--p1joyp-joypad
export class JoypadRegister implements ByteRef {
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

  get byte() {
    const upperNibble =
      0xc0 + (this.selectButtons ? 0x20 : 0) + (this.selectDpad ? 0x10 : 0)
    if (this.selectButtons) {
      return upperNibble + this.buttonNibble()
    }
    if (this.selectDpad) {
      return upperNibble + this.dpadNibble()
    }
    return upperNibble + 0xf
  }
  set byte(value: number) {
    this.selectButtons = (value & 0x10) > 0
    this.selectDpad = (value & 0x20) > 0
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
