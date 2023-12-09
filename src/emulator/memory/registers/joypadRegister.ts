import { ByteRef } from "../../refs/byteRef"

// Reference: https://gbdev.io/pandocs/Joypad_Input.html#ff00--p1joyp-joypad
export class JoypadRegister implements ByteRef {
  a = false
  b = false
  start = false
  select = false
  up = false
  down = false
  left = false
  right = false

  selectButtons = true
  selectDpad = true

  get value() {
    const upperNibble = (this.selectButtons ? 0x20 : 0)
                      + (this.selectDpad ? 0x10 : 0)
    if (this.selectButtons) {
      return (upperNibble << 4) + this.buttonNibble()
    }
    if (this.selectDpad) {
      return (upperNibble << 4) + this.dpadNibble()
    }
    return (upperNibble << 4) + 0xF
}
  set value(value: number) {
    this.selectButtons = (value & 0x20) > 0
    this.selectDpad    = (value & 0x10) > 0
  }

  private buttonNibble(): number {
    return (this.start ? 0 : 0x8)
          + (this.select ? 0 : 0x4)
          + (this.b ? 0 : 0x2)
          + (this.a ? 0 : 0x1)
  }

  private dpadNibble(): number {
    return (this.down ? 0 : 0x8)
          + (this.up ? 0 : 0x4)
          + (this.left ? 0 : 0x2)
          + (this.right ? 0 : 0x1)
  }
}