import { ByteRef, ConstantByteRef, GetSetByteRef } from "../../refs/byteRef"

type StoreRam = () => void

const RAM_WRITE_WAIT_MILLISECONDS = 500

export class Cartridge {
  title: string
  romData: Uint8Array
  ramData: Uint8Array

  storeRam: StoreRam
  ramWriteTimeout: NodeJS.Timeout

  constructor(data: Uint8Array) {
    this.romData = data
    const ramBanks = [0, 0, 1, 4, 16, 8][data[0x0149]]
    this.ramData = new Uint8Array(ramBanks * 0x2000)
    this.title = String.fromCharCode(...data.slice(0x0134, 0x0144))
    this.storeRam = () => {
      console.log("Saving save data to " + this.title + ".sav")
      const blob = new Blob([this.ramData])
      const reader = new FileReader()
      reader.onload = () => {
        window.localStorage.setItem(this.title + ".sav", reader.result?.toString() || "")
      }
      reader.readAsDataURL(blob)
    }
    this.loadLocalSave()
  }

  async loadData(file: File) {
    this.romData = (
      await file.stream().getReader().read()
    ).value || this.romData
    this.title = String.fromCharCode(...this.romData.slice(0x0134, 0x0144))
    const ramBanks = [0, 0, 1, 4, 16, 8][this.romData[0x0149]]
    this.ramData = new Uint8Array(ramBanks * 0x2000)
  }

  async loadRam(file: File) {
    this.ramData = (
      await file.stream().getReader().read()
    ).value || this.ramData
  }

  async loadLocalSave() {
    const base64 = window.localStorage.getItem(this.title + ".sav")
    if (base64 !== null) {
      const res: Response = await fetch(base64);
      const blob: Blob = await res.blob();
      const saveFileReadResult = await blob.stream().getReader().read()
      this.ramData = saveFileReadResult.value || new Uint8Array()
    }
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
      (value) => {
        this.ramData[address - 0xA000] = value
        if (this.ramWriteTimeout) { clearTimeout(this.ramWriteTimeout) }
        this.ramWriteTimeout = setTimeout(this.storeRam, RAM_WRITE_WAIT_MILLISECONDS)
      }
    )
  }
}

