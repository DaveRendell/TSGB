import { EmulatorMode } from "../emulator";
import { GetSetByteRef } from "../refs/byteRef";
import { IoRegisters } from "./registers/ioRegisters";
import { WramBankRegister } from "./registers/wramBankRegister";

export class WRAM {
  data: Uint8Array
  mode: EmulatorMode
  wramBankRegister: WramBankRegister

  constructor(mode: EmulatorMode, registers: IoRegisters) {
    this.mode = mode
    if (mode !== EmulatorMode.CGB) {
      this.data = new Uint8Array(0x2000)
    } else {
      this.data = new Uint8Array(0x8000)
      this.wramBankRegister = registers.wramBank
    }
  }

  at(address: number) {
    if (this.mode !== EmulatorMode.CGB) {
      return new GetSetByteRef(
        () => this.data[address - 0xc000],
        (value) => this.data[address - 0xc000] = value
      )
    } else {
      if (address < 0xD000) {
        return new GetSetByteRef(
          () => this.data[address - 0xc000],
          (value) => this.data[address - 0xc000] = value
        )
      } else {
        const bankStart = this.wramBankRegister.bank << 12
        const offsetAddress = address - 0xd000
        return new GetSetByteRef(
          () => this.data[bankStart + offsetAddress],
          (value) => this.data[bankStart + offsetAddress] = value
        )
      }
    }
  }
}