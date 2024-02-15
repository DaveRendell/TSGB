import { ByteRef } from "../../refs/byteRef";

export class SpeedSwitchRegister implements ByteRef {
  doubleSpeed = false
  switchArmed = false

  get byte() {
    return (this.doubleSpeed ? 0x80 : 0) + (this.switchArmed ? 1 : 0)
  }

  set byte(value) {
    this.switchArmed = (value & 1) > 0
  }
}