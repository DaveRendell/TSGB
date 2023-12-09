import { ByteRef } from "../../refs/byteRef";

export class BootRomRegister implements ByteRef {
  enabled = false

  get value(): number { return this.enabled ? 1 : 0 }
  set value(value: number) { this.enabled = value != 0 }
}