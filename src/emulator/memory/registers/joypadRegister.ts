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

  selectButtons = false
  selectDpad = false

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
    return (this.start ? 0x80 : 0)
          + (this.select ? 0x40 : 0)
          + (this.b ? 0x20 : 0)
          + (this.a ? 0x10 : 0)
  }

  private dpadNibble(): number {
    return (this.down ? 0x80 : 0)
          + (this.up ? 0x40 : 0)
          + (this.left ? 0x20 : 0)
          + (this.right ? 0x10 : 0)
  }
}