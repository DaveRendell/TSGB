import { ByteRef } from "../../refs/byteRef"

export class BootRomRegister implements ByteRef {
  enabled = false

  get byte(): number {
    return this.enabled ? 1 : 0
  }
  set byte(value: number) {
    this.enabled = value != 0
  }
}
