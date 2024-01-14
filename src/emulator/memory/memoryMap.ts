import Controller from "../controller"
import CPU from "../cpu/cpu"
import { Cartridge } from "./cartridges/cartridge"
import { createCartridge } from "./cartridges/createCartridge"
import { OAM } from "./oam"
import { IoRegisters } from "./registers/ioRegisters"
import { VRAM } from "./vram"
import { ByteRef, GetSetByteRef } from "../refs/byteRef"
import { CompositeWordRef, WordRef } from "../refs/wordRef"

// Reference: https://gbdev.io/pandocs/Memory_Map.html
export default class Memory {
  private data: Uint8Array
  cpu: CPU

  registers: IoRegisters = new IoRegisters()

  bootRomLoaded = false
  private bootRom = new Uint8Array(0x100)
  cartridge: Cartridge
  vram = new VRAM()
  oam: OAM

  controller: Controller

  constructor(cartridge: Cartridge) {
    this.data = new Uint8Array(0x10000)
    this.registers.dmaTransfer.startTransfer = (address) =>
      this.dmaTransfer(address)
    this.cartridge = cartridge
    this.oam = new OAM(this)
  }

  at(address: number): ByteRef {
    if (this.cpu.breakpoints.has(address)) {
      this.cpu.pause()
    }
    // ROM
    if (address < 0x8000) {
      if (
        address < 0x100 &&
        this.bootRomLoaded &&
        this.registers.bootRom.enabled
      ) {
        // If Boot ROM is enabled, loaded, and we're in its address range, load
        // memory from there
        return new GetSetByteRef(
          () => {
            return this.bootRom[address & 0xffff]
          },
          (_) => {},
        )
      }

      return this.cartridge.rom(address)
    }

    // VRAM
    if (address >= 0x8000 && address < 0xa000) {
      return this.vram.at(address)
    }

    // SRAM
    if (address >= 0xa000 && address < 0xc000) {
      return this.cartridge.ram(address)
    }

    // OAM
    if (address >= 0xfe00 && address < 0xfea0) {
      return this.oam.at(address)
    }

    // IO Registers
    if (address >= 0xff00 && address < 0xff80) {
      return this.registers.at(address)
    }

    // TODO remove this, handle each case explicitly
    return new GetSetByteRef(
      () => {
        return this.data[address & 0xffff]
      },
      (value) => {
        this.data[address & 0xffff] = value
      },
    )
  }

  atPointer(pointer: WordRef): ByteRef {
    return new GetSetByteRef(
      () => this.at(pointer.word).byte,
      (value) => this.at(pointer.word).byte = value
    )
  }

  atLastPagePointer(pointer: ByteRef): ByteRef {
    return new GetSetByteRef(
      () => this.at(0xff00 + pointer.byte).byte,
      (value) => this.at(0xff00 + pointer.byte).byte = value
    )
  }

  wordAt(address: number): WordRef {
    return new CompositeWordRef(this.at(address + 1), this.at(address))
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
    for (let i = 0; i < 0xa0; i++) {
      this.at(0xfe00 + i).byte = this.at(address + i).byte
    }
  }
}
