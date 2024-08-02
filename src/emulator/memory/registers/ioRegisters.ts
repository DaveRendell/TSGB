import { ByteRef, ConstantByteRef, GenericByteRef, GetSetByteRef } from "../../refs/byteRef"
import { SerialPort } from "../../serialConnections/serialPort"
import Memory from "../memoryMap"
import {
  AudioMasterControlRegister,
  MasterVolumeVinRegister,
  NoiseChannelRegisters,
  PulseChannelRegisters,
  WaveChannelRegisters,
} from "./audioRegisters"
import { BootRomRegister } from "./bootRomRegister"
import { DmaTransferRegister } from "./dmaTransferRegister"
import { InterruptRegister } from "./interruptRegisters"
import { JoypadRegister } from "./joypadRegister"
import {
  LcdControlRegister,
  LcdStatusRegister,
  PalletteRegister,
} from "./lcdRegisters"
import { PaletteRam } from "./paletteRegisters"
import SerialRegisters from "./serialRegisters"
import { SpeedSwitchRegister } from "./speedSwitchRegister"
import { DividerRegister, TimerControlRegister } from "./timerRegisters"
import { VramBankRegister } from "./vramBankRegister"
import { VramDmaRegisters } from "./vramDmaRegisters"
import { WramBankRegister } from "./wramBankRegister"

// Reference: https://gbdev.io/pandocs/Memory_Map.html#io-ranges
export class IoRegisters {
  joypad = new JoypadRegister()

  divider = new DividerRegister()
  timerCounter = new GenericByteRef()
  timerModulo = new GenericByteRef()
  timerControl = new TimerControlRegister()

  interrupts = new InterruptRegister()
  serialRegisters: SerialRegisters

  audioMasterControl = new AudioMasterControlRegister()
  masterVolumeVin = new MasterVolumeVinRegister()
  channel1 = new PulseChannelRegisters()
  channel2 = new PulseChannelRegisters()
  channel3 = new WaveChannelRegisters()
  channel4 = new NoiseChannelRegisters()

  lcdControl = new LcdControlRegister()
  lcdStatus = new LcdStatusRegister()
  scrollY = new GenericByteRef()
  scrollX = new GenericByteRef()
  scanline = new GenericByteRef()
  scanlineCoincidence = new GenericByteRef()
  dmaTransfer = new DmaTransferRegister()
  backgroundPallete = new PalletteRegister()
  objectPallete0 = new PalletteRegister()
  objectPallete1 = new PalletteRegister()

  winY = 0
  winX = 0
  windowLineCounter = new GenericByteRef()
  windowY = new GetSetByteRef(
    () => this.winY,
    (value) => {
      if (this.winY != value) {
        if (value < this.scanline.byte) {
          this.windowLineCounter.byte = this.scanline.byte
        }
        this.winY = value
      }
    }
  )
  windowX = new GenericByteRef()


  bootRom = new BootRomRegister()

  backgroundPalettes = new PaletteRam()
  objectPalettes = new PaletteRam()
  vramBank = new VramBankRegister()
  wramBank = new WramBankRegister()
  speedSwitch = new SpeedSwitchRegister()
  vramDma: VramDmaRegisters

  private data: { [address: number]: ByteRef } = []

  constructor(memory: Memory, serialPort: SerialPort) {
    this.vramDma = new VramDmaRegisters(memory)
    this.serialRegisters = new SerialRegisters(serialPort, this.interrupts)
    this.data[0xff00] = this.joypad
    this.data[0xff01] = this.serialRegisters.serialDataRegister
    this.data[0xff02] = this.serialRegisters.serialControlRegister

    // Timer
    this.data[0xff04] = this.divider
    this.data[0xff05] = this.timerCounter
    this.data[0xff06] = this.timerModulo
    this.data[0xff07] = this.timerControl

    this.data[0xff0f] = this.interrupts

    // Audio Channel 1 (Pulse 1)
    this.data[0xff10] = this.channel1.nr0
    this.data[0xff11] = this.channel1.nr1
    this.data[0xff12] = this.channel1.nr2
    this.data[0xff13] = this.channel1.nr3
    this.data[0xff14] = this.channel1.nr4
    // Audio Channel 2 (Pulse 2)
    this.data[0xff16] = this.channel2.nr1
    this.data[0xff17] = this.channel2.nr2
    this.data[0xff18] = this.channel2.nr3
    this.data[0xff19] = this.channel2.nr4
    // Audio Channel 3 (Wave)
    this.data[0xff1a] = this.channel3.nr0
    this.data[0xff1b] = this.channel3.nr1
    this.data[0xff1c] = this.channel3.nr2
    this.data[0xff1d] = this.channel3.nr3
    this.data[0xff1e] = this.channel3.nr4
    for (let i = 0; i <= 16; i++) {
      this.data[0xff30 + i] = this.channel3.sampleByte(i)
    }
    // Audio Channel 4 (Noise)
    this.data[0xff20] = this.channel4.nr1
    this.data[0xff21] = this.channel4.nr2
    this.data[0xff22] = this.channel4.nr3
    this.data[0xff23] = this.channel4.nr4

    // Master Audio
    this.data[0xff25] = this.masterVolumeVin
    this.data[0xff26] = this.audioMasterControl
    // TODO: this.data[0xFF24] panning
    // TODO: this.data[0xFF25] more panning

    // Graphics
    this.data[0xff40] = this.lcdControl
    this.data[0xff41] = this.lcdStatus
    this.data[0xff42] = this.scrollY
    this.data[0xff43] = this.scrollX
    this.data[0xff44] = this.scanline
    this.data[0xff45] = this.scanlineCoincidence
    this.data[0xff46] = this.dmaTransfer
    this.data[0xff47] = this.backgroundPallete
    this.data[0xff48] = this.objectPallete0
    this.data[0xff49] = this.objectPallete1
    this.data[0xff4a] = this.windowY
    this.data[0xff4b] = this.windowX

    this.data[0xff50] = this.bootRom

    this.data[0xff68] = this.backgroundPalettes.indexRegister
    this.data[0xff69] = this.backgroundPalettes.accessRegister
    this.data[0xff6a] = this.objectPalettes.indexRegister
    this.data[0xff6b] = this.objectPalettes.accessRegister

    this.data[0xff4f] = this.vramBank
    this.data[0xFF70] = this.wramBank
    this.data[0xFF4D] = this.speedSwitch

    this.data[0xFF51] = this.vramDma.sourceHigh
    this.data[0xFF52] = this.vramDma.sourceLow
    this.data[0xFF53] = this.vramDma.destinationHigh
    this.data[0xFF54] = this.vramDma.destinationLow
    this.data[0xFF55] = this.vramDma.settings
  }

  at(address: number): ByteRef {
    return this.data[address] || new ConstantByteRef()
  }
}
