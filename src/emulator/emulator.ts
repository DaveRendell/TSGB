import AudioProcessor from "./audio/audioProcessor"
import Controller from "./controller"
import CPU from "./cpu/cpu"
import Memory from "./memory/memoryMap"
import { Cartridge } from "./memory/cartridges/cartridge"
import PictureProcessor from "./pictureProcessor"

export enum EmulatorMode {
  DMG,
  CGB,
}

export class Emulator {
  mode: EmulatorMode
  memory: Memory
  cpu: CPU
  pictureProcessor: PictureProcessor
  audioProcessor: AudioProcessor
  controller: Controller

  constructor(cartridge: Cartridge) {
    if (cartridge.colourSupport) {
      this.mode = EmulatorMode.CGB
    } else {
      this.mode = EmulatorMode.DMG
    }
    this.memory = new Memory(cartridge)
    this.controller = new Controller(this.memory)
    this.cpu = new CPU(this.memory, this.controller, cartridge.colourSupport)
    this.pictureProcessor = new PictureProcessor(this.cpu, cartridge.colourSupport)
    this.audioProcessor = new AudioProcessor(this.cpu)
    this.controller.initialiseEvents()
  }
}
