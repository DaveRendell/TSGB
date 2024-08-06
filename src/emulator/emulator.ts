import AudioProcessor from "./audio/audioProcessor"
import Controller from "./controller"
import CPU from "./cpu/cpu"
import Memory from "./memory/memoryMap"
import { Cartridge } from "./memory/cartridges/cartridge"
import PictureProcessor from "./graphics/pictureProcessor"
import { SerialPort } from "./serialConnections/serialPort"
import { DebugConnection } from "./serialConnections/debugConnection"
import SuperEmulator from "./super/superEmulator"

export enum EmulatorMode {
  DMG,
  CGB,
  SGB,
}

export class Emulator {
  mode: EmulatorMode
  memory: Memory
  cpu: CPU
  pictureProcessor: PictureProcessor
  audioProcessor: AudioProcessor
  controller: Controller
  serialPort: SerialPort
  superEmulator?: SuperEmulator

  constructor(cartridge: Cartridge, mode: EmulatorMode, colouriseDmg: boolean = false) {
    this.mode = mode
    this.serialPort = { type: "debug", connection: new DebugConnection() }
    if (this.mode === EmulatorMode.SGB) {
      this.superEmulator = new SuperEmulator()
    }
    this.memory = new Memory(cartridge, this.mode, this.serialPort, this.superEmulator)
    this.controller = new Controller(this.memory)
    this.cpu = new CPU(this.memory, this.controller, this.serialPort, mode)
    this.pictureProcessor = new PictureProcessor(this.cpu, mode, colouriseDmg)
    this.audioProcessor = new AudioProcessor(this.cpu)
    this.controller.initialiseEvents()
  }
}
