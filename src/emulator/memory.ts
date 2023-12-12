import Controller from "./controller"
import { Cartridge } from "./memory/cartridges/cartridge"
import { createCartridge } from "./memory/cartridges/createCartridge"
import { IoRegisters } from "./memory/registers/ioRegisters"
import { VRAM } from "./memory/vram"
import { ByteRef, GetSetByteRef } from "./refs/byteRef"
import { CompositeWordRef, WordRef } from "./refs/wordRef"

// Reference: https://gbdev.io/pandocs/Memory_Map.html
export default class Memory {
  private data: Uint8Array

  registers: IoRegisters = new IoRegisters()

  bootRomLoaded = false
  private bootRom = new Uint8Array(0x100)
  private cartridge: Cartridge
  vram: VRAM = new VRAM()

  controller: Controller

  constructor() {
    this.data = new Uint8Array(0x10000)
    this.registers.dmaTransfer.startTransfer =
      (address) => this.dmaTransfer(address)
    this.cartridge = new Cartridge(new Uint8Array())
  }

  at(address: number): ByteRef {
    // ROM
    if (address < 0x8000) { 
      if (
        address < 0x100
        && this.bootRomLoaded
        && this.registers.bootRom.enabled
      ) {
        // If Boot ROM is enabled, loaded, and we're in its address range, load
        // memory from there
        return new GetSetByteRef(
          () => { return this.bootRom[address & 0xFFFF] },
          (_) => {  }
        )
      }

      return this.cartridge.rom(address)
    }

    if (address >= 0x8000 && address < 0xA000) {
      return this.vram.at(address)
    }

    // IO Registers
    if (address >= 0xFF00 && address < 0xFF80) {
      return this.registers.at(address)
    }

    // TODO remove this, handle each case explicitly
    return new GetSetByteRef(
      () => { return this.data[address & 0xFFFF] },
      (value) => { this.data[address & 0xFFFF] = value }
    )
  }

  wordAt(address: number): WordRef {
      return new CompositeWordRef(this.at(address + 1), this.at(address))
  }
  
  async loadGame(file: File) {
    this.cartridge = await createCartridge(file)
  }

  async loadBootRom(file: File) {
    // this.bootRom = (
    //   await file.stream().getReader().read()
    // ).value || this.bootRom
    // this.bootRomLoaded = true
    // this.data[0xFF50] = 1
  }

  // https://gbdev.io/pandocs/OAM_DMA_Transfer.html
  dmaTransfer(address: number) {
    for (let i = 0; i < 0xA0; i++) {
      this.data[0xFE00 + i] = this.data[address + i]
    }
  }
}