// Reference:
// https://gbdev.io/pandocs/Timer_and_Divider_Registers.html#timer-and-divider-registers

import { ByteRef } from "../../refs/byteRef"

export class DividerRegister implements ByteRef {
  private _value: number = 0

  get byte(): number {
    return this._value
  }
  set byte(_: number) {
    this._value = 0
  } // TODO should reset on write, seperate increment method?

  increment() {
    this._value = (this._value + 1) & 0xff
  }
}

export class TimerControlRegister implements ByteRef {
  enabled: boolean = false
  clockSelect: number = 0

  get byte(): number {
    return this.clockSelect + (this.enabled ? 0x4 : 0)
  }
  set byte(value: number) {
    this.enabled = (value & 0x4) > 0
    this.clockSelect = value & 0x3
  }
}
