import Controller from "../controller"
import CPU from "../cpu/cpu"
import { Cartridge } from "./cartridges/cartridge"
import { OAM } from "./oam"
import { IoRegisters } from "./registers/ioRegisters"
import { VRAM } from "./vram"
import { ByteRef, ConstantByteRef, GetSetByteRef } from "../refs/byteRef"
import { CompositeWordRef, WordRef } from "../refs/wordRef"
import { InterruptEnabledRegister } from "./registers/interruptRegisters"
import { WRAM } from "./wram"
import { EmulatorMode } from "../emulator"

// Reference: https://gbdev.io/pandocs/Memory_Map.html
export default class Memory {
  cpu: CPU

  registers: IoRegisters = new IoRegisters()

  bootRomLoaded = false
  cartridge: Cartridge
  vram = new VRAM(this.registers)
  wram: WRAM
  oam: OAM
  hram = new Uint8Array(0x7f)
  interruptsEnabled = new InterruptEnabledRegister()

  controller: Controller

  constructor(cartridge: Cartridge, mode: EmulatorMode) {
    this.registers.dmaTransfer.startTransfer = (address) =>
      this.dmaTransfer(address)
    this.cartridge = cartridge
    this.oam = new OAM(this)
    this.wram = new WRAM(mode, this.registers)
  }

  at(address: number): ByteRef {
    // ROM
    if (address < 0x8000) {
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

    // WRAM
    if (address >= 0xc000 && address < 0xe000) {
      return this.wram.at(address)
    }

    // Echo RAM
    if (address >= 0xe000 && address < 0xfe00) {
      return new GetSetByteRef(
        () => this.wram[address - 0xe000],
        (value) => this.wram[address - 0xe000] = value
      )
    }
    
    // OAM
    if (address >= 0xfe00 && address < 0xfea0) {
      return this.oam.at(address)
    }

    // Prohibited
    if (address >= 0xFEA0 && address < 0xFEFF) {
      return new ConstantByteRef(0xFF)
    }

    // IO Registers
    if (address >= 0xff00 && address < 0xff80) {
      return this.registers.at(address)
    }

    // HRAM
    if (address >= 0xff80 && address < 0xffff) {
      return new GetSetByteRef(
        () => this.hram[address - 0xff80],
        (value) => this.hram[address - 0xff80] = value
      )
    }

    return this.interruptsEnabled
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
