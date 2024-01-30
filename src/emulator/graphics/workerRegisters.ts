import { LcdControlRegister, PalletteRegister } from "../memory/registers/lcdRegisters";
import { ByteRef, ConstantByteRef, GenericByteRef } from "../refs/byteRef";

export class WorkerRegisters {
  lcdControl = new LcdControlRegister()
  scrollY = new GenericByteRef()
  scrollX = new GenericByteRef()
  scanline = new GenericByteRef()
  backgroundPallete = new PalletteRegister()
  objectPallete0 = new PalletteRegister()
  objectPallete1 = new PalletteRegister()
  windowY = new GenericByteRef()
  windowX = new GenericByteRef()

  private data: { [address: number]: ByteRef } = []

  constructor() {
    this.data[0xff40] = this.lcdControl
    this.data[0xff42] = this.scrollY
    this.data[0xff43] = this.scrollX
    this.data[0xff44] = this.scanline
    this.data[0xff47] = this.backgroundPallete
    this.data[0xff48] = this.objectPallete0
    this.data[0xff49] = this.objectPallete1
    this.data[0xff4a] = this.windowY
    this.data[0xff4b] = this.windowX
  }

  at(address: number): ByteRef {
    return this.data[address] || new ConstantByteRef()
  }
}