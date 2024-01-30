import AudioProcessor from "./audio/audioProcessor"
import Controller from "./controller"
import CPU from "./cpu/cpu"
import Memory from "./memory/memoryMap"
import { Cartridge } from "./memory/cartridges/cartridge"
import PictureProcessor from "./pictureProcessor"
import renderWorkerUrl from "./graphics/renderWorker?worker&url"

export class Emulator {
  memory: Memory
  cpu: CPU
  pictureProcessor: PictureProcessor
  audioProcessor: AudioProcessor
  controller: Controller
  renderWorker: Worker

  constructor(cartridge: Cartridge) {
    this.renderWorker = new Worker(renderWorkerUrl, { type: "module" })
    this.memory = new Memory(cartridge, this.renderWorker)
    this.controller = new Controller(this.memory)
    this.cpu = new CPU(this.memory, this.controller)
    this.pictureProcessor = new PictureProcessor(this.cpu)
    this.audioProcessor = new AudioProcessor(this.cpu)
    this.controller.initialiseEvents()
    
    this.renderWorker.postMessage({ type: 1, data: "bleh"})
  }
}
