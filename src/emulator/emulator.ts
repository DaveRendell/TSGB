import AudioProcessor from "./audio/audioProcessor"
import Controller from "./controller"
import CPU from "./cpu/cpu"
import Memory from "./memory/memoryMap"
import { Cartridge } from "./memory/cartridges/cartridge"
import PictureProcessor from "./pictureProcessor"
import renderWorkerUrl from "./renderWorker?worker&url"

export class Emulator {
  memory: Memory
  cpu: CPU
  pictureProcessor: PictureProcessor
  audioProcessor: AudioProcessor
  controller: Controller
  renderWorker: Worker

  constructor(cartridge: Cartridge) {
    this.memory = new Memory(cartridge)
    this.controller = new Controller(this.memory)
    this.cpu = new CPU(this.memory, this.controller)
    this.pictureProcessor = new PictureProcessor(this.cpu)
    this.audioProcessor = new AudioProcessor(this.cpu)
    this.controller.initialiseEvents()
    this.renderWorker = new Worker(renderWorkerUrl, { type: "module" })
    
    this.renderWorker.postMessage({ type: 1, data: "bleh"})
  }
}
