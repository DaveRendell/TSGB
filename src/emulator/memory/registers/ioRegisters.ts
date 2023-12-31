import { ByteRef, ConstantByteRef, GenericByteRef } from "../../refs/byteRef"
import { AudioMasterControlRegister, MasterVolumeVinRegister, NoiseChannelRegisters, PulseChannelRegisters, WaveChannelRegisters } from "./audioRegisters"
import { BootRomRegister } from "./bootRomRegister"
import { DmaTransferRegister } from "./dmaTransferRegister"
import { InterruptRegister } from "./interruptRegisters"
import { JoypadRegister } from "./joypadRegister"
import { LcdControlRegister, LcdStatusRegister, PalletteRegister } from "./lcdRegisters"
import { DividerRegister, TimerControlRegister } from "./timerRegisters"

// Reference: https://gbdev.io/pandocs/Memory_Map.html#io-ranges
export class IoRegisters {
  joypad = new JoypadRegister()

  divider = new DividerRegister()
  timerCounter = new GenericByteRef()
  timerModulo = new GenericByteRef()
  timerControl = new TimerControlRegister()

  interrupts = new InterruptRegister()

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
  windowY = new GenericByteRef()
  windowX = new GenericByteRef()

  bootRom = new BootRomRegister()

  private data: { [address: number]: ByteRef } = [] 

  constructor() {
    this.data[0xFF00] = this.joypad

    // Timer
    this.data[0xFF04] = this.divider
    this.data[0xFF05] = this.timerCounter
    this.data[0xFF06] = this.timerModulo
    this.data[0xFF07] = this.timerControl

    this.data[0xFF0F] = this.interrupts

    // Audio Channel 1 (Pulse 1)
    this.data[0xFF10] = this.channel1.nr0
    this.data[0xFF11] = this.channel1.nr1
    this.data[0xFF12] = this.channel1.nr2
    this.data[0xFF13] = this.channel1.nr3
    this.data[0xFF14] = this.channel1.nr4
    // Audio Channel 2 (Pulse 2)
    this.data[0xFF16] = this.channel2.nr1
    this.data[0xFF17] = this.channel2.nr2
    this.data[0xFF18] = this.channel2.nr3
    this.data[0xFF19] = this.channel2.nr4
    // Audio Channel 3 (Wave)
    this.data[0xFF1A] = this.channel3.nr0
    this.data[0xFF1B] = this.channel3.nr1
    this.data[0xFF1C] = this.channel3.nr2
    this.data[0xFF1D] = this.channel3.nr3
    this.data[0xFF1E] = this.channel3.nr4
    for (let i = 0; i <= 16; i++) {
      this.data[0xFF30 + i] = this.channel3.sampleByte(i)
    }
    // Audio Channel 4 (Noise)
    this.data[0xFF20] = this.channel4.nr1
    this.data[0xFF21] = this.channel4.nr2
    this.data[0xFF22] = this.channel4.nr3
    this.data[0xFF23] = this.channel4.nr4

    // Master Audio
    this.data[0xFF25] = this.masterVolumeVin
    this.data[0xFF26] = this.audioMasterControl
    // TODO: this.data[0xFF24] panning
    // TODO: this.data[0xFF25] more panning

    // Graphics
    this.data[0xFF40] = this.lcdControl
    this.data[0xFF41] = this.lcdStatus
    this.data[0xFF42] = this.scrollY
    this.data[0xFF43] = this.scrollX
    this.data[0xFF44] = this.scanline
    this.data[0xFF45] = this.scanlineCoincidence
    this.data[0xFF46] = this.dmaTransfer
    this.data[0xFF47] = this.backgroundPallete
    this.data[0xFF48] = this.objectPallete0
    this.data[0xFF49] = this.objectPallete1
    this.data[0xFF4A] = this.windowY
    this.data[0xFF4B] = this.windowX

    this.data[0xFF50] = this.bootRom
  }

  at(address: number): ByteRef {
    return this.data[address] || new ConstantByteRef()
  }
}