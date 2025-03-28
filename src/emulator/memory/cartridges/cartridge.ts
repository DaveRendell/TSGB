import { ByteRef, ConstantByteRef, GetSetByteRef } from "../../refs/byteRef"

export type StoreRam = (data: Uint8Array) => void

const RAM_WRITE_WAIT_MILLISECONDS = 500

export class Cartridge {
  title: string
  colourSupport: boolean
  romData: Uint8Array
  ramData: Uint8Array

  storeRam: StoreRam
  ramWriteTimeout: NodeJS.Timeout

  constructor(data: Uint8Array, storeRam: StoreRam, loadedSave?: Uint8Array) {
    this.romData = data
    if (loadedSave) {
      this.ramData = loadedSave
    } else {
      const ramBanks = [0, 0, 1, 4, 16, 8][data[0x0149]]
      this.ramData = new Uint8Array(ramBanks * 0x2000)
    }

    this.title = String.fromCharCode(...data.slice(0x0134, 0x0144))
    this.colourSupport = (data[0x143] & 0x80) > 0
    this.storeRam = storeRam
  }

  async loadData(file: File) {
    this.romData =
      (await file.stream().getReader().read()).value || this.romData
    this.title = String.fromCharCode(...this.romData.slice(0x0134, 0x0144))
    const ramBanks = [0, 0, 1, 4, 16, 8][this.romData[0x0149]]
    this.ramData = new Uint8Array(ramBanks * 0x2000)
  }

  async loadRam(file: File) {
    this.ramData =
      (await file.stream().getReader().read()).value || this.ramData
  }

  rom(address: number): ByteRef {
    return new GetSetByteRef(
      () => {
        return this.romData[address & 0xffff]
      },
      (_) => {},
    )
  }

  ram(address: number): ByteRef {
    return new GetSetByteRef(
      () => this.ramData[address - 0xa000],
      (value) => {
        this.ramData[address - 0xa000] = value
        if (this.ramWriteTimeout) {
          return
        }
        this.ramWriteTimeout = setTimeout(
          () => {
            this.storeRam(this.ramData)
            this.ramWriteTimeout = undefined
          },
          RAM_WRITE_WAIT_MILLISECONDS,
        )
      },
    )
  }

  romBank(address: number): number { return 0 }
  ramBank(address: number): number { return 0 }
}
