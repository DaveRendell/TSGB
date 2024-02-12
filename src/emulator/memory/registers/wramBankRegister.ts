import { ByteRef } from "../../refs/byteRef";

export class WramBankRegister implements ByteRef {
  bank = 0

  get byte() { return this.bank }
  set byte(value) { this.bank = value & 7 }
}