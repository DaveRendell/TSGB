import { ByteRef, ConstantByteRef, GetSetByteRef } from "../../refs/byteRef"

export class Cartridge {
  romData: Uint8Array

  constructor(data: Uint8Array) {
    this.romData = data
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

  ram(_: number): ByteRef {
    return new ConstantByteRef(0)
  }
}

