// Reference:
// https://gbdev.io/pandocs/Timer_and_Divider_Registers.html#timer-and-divider-registers

import { ByteRef } from "../../refs/byteRef";

export class DividerRegister implements ByteRef {
  private _value: number = 0

  get value(): number { return this._value }
  set value(value: number) { this._value = value } // TODO should reset on write, seperate increment method?
}

export class TimerControlRegister implements ByteRef {
  enabled: boolean = false
  clockSelect: number = 0

  get value(): number {
    return this.clockSelect + (this.enabled ? 0x4 : 0)
  }
  set value(value: number) {
    this.enabled = (value & 0x4) > 0
    this.clockSelect = value & 0x3
  }
}
