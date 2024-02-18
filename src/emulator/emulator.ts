import AudioProcessor from "./audio/audioProcessor"
import Controller from "./controller"
import CPU from "./cpu/cpu"
import Memory from "./memory/memoryMap"
import { Cartridge } from "./memory/cartridges/cartridge"
import PictureProcessor from "./graphics/pictureProcessor"

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

  constructor(cartridge: Cartridge, mode: EmulatorMode) {
    this.mode = mode
    this.memory = new Memory(cartridge, this.mode)
    this.controller = new Controller(this.memory)
    this.cpu = new CPU(this.memory, this.controller, mode)
    this.pictureProcessor = new PictureProcessor(this.cpu, mode)
    this.audioProcessor = new AudioProcessor(this.cpu)
    this.controller.initialiseEvents()
  }
}
