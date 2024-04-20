import { ByteRef } from "../../refs/byteRef";

export class WramBankRegister implements ByteRef {
  bank = 1

  get byte() { return this.bank + 0xf8 }
  set byte(value) {
    this.bank = (value & 7)
    if (this.bank == 0) { this.bank = 1 }
  }
}