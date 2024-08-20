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
import DMA from "./dma"
import { SerialPort } from "../serialConnections/serialPort"
import SuperEmulator from "../super/superEmulator"
import { MemoryRegion } from "../debug/types"

// Reference: https://gbdev.io/pandocs/Memory_Map.html
export default class Memory {
  cpu: CPU

  registers: IoRegisters

  bootRomLoaded = false
  cartridge: Cartridge
  vram: VRAM
  wram: WRAM
  oam: OAM
  hram = new Uint8Array(0x7f)
  interruptsEnabled = new InterruptEnabledRegister()

  dma: DMA

  controller: Controller

  // Debug
  symbols: Map<number, Map<number, number>> = new Map()

  constructor(cartridge: Cartridge, mode: EmulatorMode, serialPort: SerialPort, superEmulator?: SuperEmulator) {
    this.registers = new IoRegisters(this, serialPort, mode, superEmulator)
    this.vram = new VRAM(this.registers, mode)
    this.registers.dmaTransfer.startTransfer = (address) =>
      this.dmaTransfer(address)
    this.cartridge = cartridge
    this.oam = new OAM(this)
    this.wram = new WRAM(mode, this.registers)
    this.dma = new DMA(this)
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
      return this.wram.at(address - 0x2000)
    }
    
    // OAM
    if (address >= 0xfe00 && address < 0xfea0) {
      return this.oam.at(address)
    }

    // Prohibited
    if (address >= 0xFEA0 && address < 0xFf00) {
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

    if (address == 0xffff) {
      return this.interruptsEnabled
    }
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

  getRegion(address: number): { name: MemoryRegion, bank: number } {
    let bank = 0
    if (address >= 0x0000 && address < 0x8000) { // ROM banks
      return { name: "rom", bank: this.cartridge.romBank(address) }
    }

    if (address >= 0x8000 && address < 0xA000) { // VRAM
      return { name: "vram", bank: this.registers.vramBank.bank }
    }

    if (address >= 0xA000 && address < 0xC000) { // SRAM
      return { name: "sram", bank: this.cartridge.ramBank(address) }
    }

    if (address >= 0xC000 && address < 0xD000) { // WRAM bank 0
      return { name: "wram", bank: 0 }
    }

    if (address >= 0xD000 && address < 0xE000) { // WRAM banked section
      return { name: "wram", bank: this.registers.wramBank.bank }
    }

    if (address >= 0xE000 && address < 0xF000) { // Echo RAM bank 0
      return { name: "echo", bank: 0 }
    }

    if (address >= 0xF000 && address < 0xFE00) { // Echo RAM banked section
      return { name: "echo", bank: this.registers.wramBank.bank }
    }

    if (address >= 0xFE00 && address < 0xFEA0) { // OAM
      return { name: "oam", bank: 0 }
    }

    if (address >= 0xFEA0 && address < 0xFF00) { // Forbidden
      return { name: "forbidden", bank: 0 }
    }

    if (address >= 0xFF00 && address < 0xFF80) { // IO Registers
      return { name: "ioRegisters", bank: 0 }
    }

    if (address >= 0xFF80 && address < 0xFFFE) { // HRAM
      return { name: "hram", bank: 0 }
    }

    return { name: "ioRegisters", bank: 0 } // Interrupt enabled register at 0xFFFF
  }
}
