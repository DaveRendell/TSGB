import { ByteRef, ConstantByteRef, GetSetByteRef } from "../../refs/byteRef"

export class Cartridge {
  romData: Uint8Array
  ramData: Uint8Array

  constructor(data: Uint8Array) {
    this.romData = data
    const ramBanks = [0, 0, 1, 4, 16, 8][data[0x0149]]
    this.ramData = new Uint8Array(ramBanks * 0x400)
  }

  async loadData(file: File) {
    this.romData = (
      await file.stream().getReader().read()
    ).value || this.romData
  }

  rom(address: number): ByteRef {
    return new GetSetByteRef(
      () => { return this.romData[address & 0xFFFF] },
      (_) => {  }
    )
  }

  ram(address: number): ByteRef {
    return new GetSetByteRef(
      () => this.ramData[address - 0xA000],
      (value) => this.ramData[address - 0xA000] = value
    )
  }
}

