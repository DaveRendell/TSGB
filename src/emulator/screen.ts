import CPU from "./cpu";
import Memory from "./memory";
import { Interrupt } from "./memory/registers/interruptRegisters";
import { LcdControlRegister, LcdStatusRegister, PalletteRegister } from "./memory/registers/lcdRegisters";
import { ByteRef } from "./refs/byteRef";

const WIDTH = 160
const HEIGHT = 144
const SCANLINES = 154

type Mode = "HBlank" | "VBlank" | "Scanline OAM" | "Scanline VRAM"

export default class Screen {
  cpu: CPU
  memory: Memory
  canvas: HTMLCanvasElement
  buffer: OffscreenCanvas
  bufferContext: OffscreenCanvasRenderingContext2D

  lcdControl: LcdControlRegister
  lcdStatus: LcdStatusRegister
  scrollX: ByteRef
  scrollY: ByteRef
  scanlineNumber: ByteRef
  backgroundPallette: PalletteRegister
  coincidence: ByteRef
  clockCount = 0

  windowLine = 0

  mode: Mode = "Scanline OAM"

  newFrameDrawn = false

  colours = [
    [255, 255, 255],
    [192, 192, 192],
    [96, 96, 96],
    [0, 0, 0],
  ]

  constructor(cpu: CPU) {
    this.cpu = cpu
    this.memory = cpu.memory
    this.buffer = new OffscreenCanvas(WIDTH, HEIGHT)
    this.bufferContext = this.buffer.getContext("2d")!

    this.lcdControl = this.memory.registers.lcdControl
    this.lcdStatus = this.memory.registers.lcdStatus
    this.scrollY = this.memory.registers.scrollY
    this.scrollX = this.memory.registers.scrollX
    this.scanlineNumber = this.memory.registers.scanline
    this.backgroundPallette = this.memory.registers.backgroundPallete
    this.coincidence = this.memory.registers.scanlineCoincidence

    cpu.addClockCallback(this)
    cpu.screen = this
  }

  // Returns true if new frame is rendered
  updateClock(cycle: number) {
    this.clockCount += cycle
    switch(this.mode) {
      case "HBlank": // Mode 0
        if (this.clockCount >= 204) {
          this.clockCount -= 204
          this.setScanline(this.scanlineNumber.value + 1)
          if (this.lcdControl.windowEnabled
            && this.scanlineNumber.value > this.memory.registers.windowY.value
            && this.memory.registers.windowX.value <= 166
          ) {
            this.windowLine++
          }
          if (this.scanlineNumber.value === HEIGHT) {
            this.renderScreen()
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
          this.setScanline(this.scanlineNumber.value + 1)
          if (this.scanlineNumber.value > SCANLINES) {
            this.setScanline(0)
            this.windowLine = 0
            this.renderScanline()
            this.setMode("HBlank")
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
          this.renderScanline()
          this.setMode("HBlank")
        }
        break
    }
  }

  setScanline(value: number) {
    this.scanlineNumber.value = value

    if (
      this.lcdControl.enabled
      && this.lcdStatus.lycInterruptEnabled
      && this.scanlineNumber.value == this.coincidence.value
    ) {
      this.lcdStatus.lycCoinciding = true
      this.memory.registers.interrupts.setInterrupt(Interrupt.LCD)
    } else {
      this.lcdStatus.lycCoinciding = false
    }
  }

  setMode(mode: Mode) {
    switch(mode) {
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

  renderScanline(): void {
    if (!this.lcdControl.enabled) { return }

    const scanline = this.scanlineNumber.value

    const line = this.bufferContext.createImageData(WIDTH, 1)

    const scrollX = this.scrollX.value
    const scrollY = this.scrollY.value
    const backgroundY = (scrollY + scanline) & 0xFF

    // Returns the 8 long row of the background tile at pixel offset given
    const getBackgroundTileRow = (offset: number): number[] => {
      const backgroundX = (scrollX + offset) & 0xFF
      const tileMapNumber = (backgroundX >> 3) + ((backgroundY >> 3) << 5)
      const tileId = this.lcdControl.backgroundTilemap == 0
        ? this.memory.vram.tilemap0(tileMapNumber)
        : this.memory.vram.tilemap1(tileMapNumber)
      const row = backgroundY & 0x7
      return this.lcdControl.tileDataArea == 1
        ? this.memory.vram.tileset0(tileId, row)
        : this.memory.vram.tileset1(tileId, row)
    }

    const winY = scanline - this.memory.registers.windowY.value

    // Returns the 8 long row of the background tile at pixel offset given
    const getWindowTileRow = (offset: number): number[] => {
      const tileMapNumber = (offset >> 3) + ((this.windowLine >> 3) << 5)
      const tileId = this.lcdControl.windowTilemap == 0
        ? this.memory.vram.tilemap0(tileMapNumber)
        : this.memory.vram.tilemap1(tileMapNumber)
      const row = this.windowLine & 0x7
      return this.lcdControl.tileDataArea == 1
        ? this.memory.vram.tileset0(tileId, row)
        : this.memory.vram.tileset1(tileId, row)
    }

    let backgroundTileRow = getBackgroundTileRow(0)
    let backgroundTileCounter = scrollX & 0x7

    let windowTileRow = getWindowTileRow(0)
    let windowTileCounter = 0

    const sprites = this.memory.oam.spritesAtScanline()
    const highPrioritySprites = sprites.filter(s => !s.priority)
    const lowPrioritySprites = sprites.filter(s => s.priority)
    
    for (let i = 0; i < WIDTH; i++) {
      if (!this.lcdControl.enabled) { return }
      let pixel: number | undefined

      // Render high priority sprites (that go above background)
      if (pixel === undefined && this.lcdControl.objectsEnabled) {
        const sprite = highPrioritySprites
          .find(sprite => (i - (sprite.x - 8) >= 0) && (i - (sprite.x - 8) < 8))
        if (sprite) {
          pixel = sprite.pixelAt(scanline, i, this.lcdControl.objectSize)
        }
      }

      let tilePixel: number | undefined = undefined

      // Render window
      const winX = i - (this.memory.registers.windowX.value - 7)
      if (pixel === undefined && this.lcdControl.windowEnabled) {
        if (winY >= 0 && winX >= 0) {
          const windowPixel = windowTileRow[winX % 8]
          tilePixel = this.backgroundPallette.map[windowPixel]   
        }
      }
      if (winX >= 0 && winY >= 0) {
        windowTileCounter ++
        if (windowTileCounter === 8) {
          windowTileCounter = 0
          windowTileRow = getWindowTileRow(winX + 1)
        }
      }
      
      // Render background (excluding the lowest colour in the pallete)
      if (pixel === undefined && tilePixel == undefined && this.lcdControl.backgroundWindowDisplay) {
        const backgroundPixel = backgroundTileRow[(scrollX + i) % 8]
        tilePixel = this.backgroundPallette.map[backgroundPixel]
      }
      
      // Get next background tile if needed
      backgroundTileCounter++
      if (backgroundTileCounter === 8) {
        backgroundTileCounter = 0
        backgroundTileRow = getBackgroundTileRow(i + 1)
      }

      if (tilePixel) {
        pixel = tilePixel
      }

      // Render low priority sprites (that go below non zero background)
      if (pixel === undefined && this.lcdControl.objectsEnabled) {
        const sprite = lowPrioritySprites
          .find(sprite => (i - (sprite.x - 8) >= 0) && (i - (sprite.x - 8) < 8))
        if (sprite) {
          pixel = sprite.pixelAt(scanline, i, this.lcdControl.objectSize)
        }
      }

      // If nothing else has rendered, use the lowest colour in the pallete
      if (pixel === undefined) {
        pixel = this.backgroundPallette.map[0]
      }

      const colour = this.colours[pixel]
      line.data[4 * i + 0] = colour[0]
      line.data[4 * i + 1] = colour[1]
      line.data[4 * i + 2] = colour[2]
      line.data[4 * i + 3] = 255

    }

    // Finally, add the new line to the buffer image
    this.bufferContext.putImageData(line, 0, scanline)    
  }

  renderScreen(): void {
    if (this.canvas) {
      const screenContext = this.canvas.getContext("2d")!
      screenContext.drawImage(this.buffer, 0, 0)
    }
  }
}