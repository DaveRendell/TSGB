import { ByteRef } from "../refs/byteRef"

export class Flags implements ByteRef {
  zero = false
  operation = false
  halfCarry = false
  carry = false

  get byte() {
    return (
      (this.zero ? 0x80 : 0) +
      (this.operation ? 0x40 : 0) +
      (this.halfCarry ? 0x20 : 0) +
      (this.carry ? 0x10 : 0)
    )
  }

  set byte(value: number) {
    this.zero = (value & 0x80) > 0
    this.operation = (value & 0x40) > 0
    this.halfCarry = (value & 0x20) > 0
    this.carry = (value & 0x10) > 0
  }
}
