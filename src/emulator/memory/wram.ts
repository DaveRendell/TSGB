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
    if (mode === EmulatorMode.DMG) {
      this.data = new Uint8Array(0x2000)
    } else {
      this.data = new Uint8Array(0x8000)
      this.wramBankRegister = registers.wramBank
    }
  }

  at(address: number) {
    if (this.mode === EmulatorMode.DMG) {
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
        return new GetSetByteRef(
          () => this.data[(this.wramBankRegister.bank << 12) + address - 0xc000],
          (value) => this.data[(this.wramBankRegister.bank << 12) + address - 0xc000] = value
        )
      }
    }
  }
}