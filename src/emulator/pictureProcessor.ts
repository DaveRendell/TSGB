import CPU from "./cpu/cpu"
import DmgScanlineRenderer from "./dmgScanlineRenderer"
import GbcScanlineRenderer from "./gbcScanlineRenderer"
import Memory from "./memory/memoryMap"
import { Interrupt } from "./memory/registers/interruptRegisters"
import {
  LcdControlRegister,
  LcdStatusRegister,
  PalletteRegister,
} from "./memory/registers/lcdRegisters"
import { SpeedSwitchRegister } from "./memory/registers/speedSwitchRegister"
import { ByteRef } from "./refs/byteRef"
import ScanlineRenderer from "./scanlineRenderer"

const WIDTH = 160
const HEIGHT = 144
const SCANLINES = 154

type Mode = "HBlank" | "VBlank" | "Scanline OAM" | "Scanline VRAM"

export default class PictureProcessor {
  memory: Memory

  scanlineRenderer: ScanlineRenderer

  lcdControl: LcdControlRegister
  lcdStatus: LcdStatusRegister
  scanlineNumber: ByteRef
  coincidence: ByteRef
  clockCount = 0

  mode: Mode = "Scanline OAM"

  newFrameDrawn = false

  speedSwitchRegister: SpeedSwitchRegister

  colours = [
    [255, 255, 255],
    [192, 192, 192],
    [96, 96, 96],
    [0, 0, 0],
  ]

  constructor(cpu: CPU, colourMode: boolean) {
    this.memory = cpu.memory

    this.lcdControl = this.memory.registers.lcdControl
    this.lcdStatus = this.memory.registers.lcdStatus
    this.scanlineNumber = this.memory.registers.scanline
    this.coincidence = this.memory.registers.scanlineCoincidence
    this.speedSwitchRegister = this.memory.registers.speedSwitch

    cpu.addClockCallback(this)
    cpu.pictureProcessor = this

    if (!colourMode) {
      this.scanlineRenderer = new DmgScanlineRenderer(
        this.memory.registers, this.memory.vram, this.memory.oam)
    } else {
      this.scanlineRenderer = new GbcScanlineRenderer(
        this.memory.registers, this.memory.vram, this.memory.oam
      )
    }
  }

  // Returns true if new frame is rendered
  updateClock(cycle: number) {
    if (!this.lcdControl.enabled) {
      this.setMode("VBlank")
      return
    }
    this.clockCount += this.speedSwitchRegister.doubleSpeed ? cycle >> 1 : cycle
    switch (this.mode) {
      case "HBlank": // Mode 0
        if (this.clockCount >= 204) {
          this.clockCount -= 204
          this.setScanline(this.scanlineNumber.byte + 1)
          if (
            this.lcdControl.windowEnabled &&
            this.scanlineNumber.byte > this.memory.registers.windowY.byte &&
            this.memory.registers.windowX.byte <= 166
          ) {
            this.scanlineRenderer.windowLine++
          }
          if (this.scanlineNumber.byte === HEIGHT) {
            this.scanlineRenderer.renderScreen()
            this.setMode("VBlank")
            this.newFrameDrawn = true
          } else {
            this.setMode("Scanline OAM")
          }
        }
        break
      case "VBlank": // Mode 1
        if (this.clockCount >= 456) {
          this.clockCount -= 456
          this.setScanline(this.scanlineNumber.byte + 1)
          if (this.scanlineNumber.byte > SCANLINES) {
            this.setScanline(0)
            this.scanlineRenderer.windowLine = 0
            this.setMode("Scanline OAM")
          }
        }
        break
      case "Scanline OAM": // Mode 2
        if (this.clockCount >= 80) {
          this.clockCount -= 80
          this.setMode("Scanline VRAM")
        }
        break
      case "Scanline VRAM": // Mode 3
        if (this.clockCount >= 172) {
          this.clockCount -= 172
          this.scanlineRenderer.renderScanline()
          this.setMode("HBlank")
        }
        break
    }
  }

  setScanline(value: number) {
    this.scanlineNumber.byte = value

    if (
      this.lcdControl.enabled &&
      this.lcdStatus.lycInterruptEnabled &&
      this.scanlineNumber.byte == this.coincidence.byte
    ) {
      this.lcdStatus.lycCoinciding = true
      this.memory.registers.interrupts.setInterrupt(Interrupt.LCD)
    } else {
      this.lcdStatus.lycCoinciding = false
    }
  }

  setMode(mode: Mode) {
    switch (mode) {
      case "HBlank":
        if (this.lcdControl.enabled && this.lcdStatus.mode0InterruptEnabled) {
          this.memory.registers.interrupts.setInterrupt(Interrupt.LCD)
        }
        this.lcdStatus.mode = 0
        break
      case "VBlank":
        if (this.lcdControl.enabled) {
          this.memory.registers.interrupts.setInterrupt(Interrupt.VBlank)
          if (this.lcdStatus.mode1InterruptEnabled) {
            this.memory.registers.interrupts.setInterrupt(Interrupt.LCD)
          }
        }
        this.lcdStatus.mode = 1
        break
      case "Scanline OAM":
        if (this.lcdControl.enabled && this.lcdStatus.mode2InterruptEnabled) {
          this.memory.registers.interrupts.setInterrupt(Interrupt.LCD)
        }
        this.lcdStatus.mode = 2
        break
      case "Scanline VRAM":
        this.lcdStatus.mode = 3
        break
    }
    this.mode = mode
  }
}
