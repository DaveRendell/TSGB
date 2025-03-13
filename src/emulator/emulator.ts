import AudioProcessor from "./audio/audioProcessor"
import Controller from "./controller"
import CPU from "./cpu/cpu"
import Memory from "./memory/memoryMap"
import { Cartridge } from "./memory/cartridges/cartridge"
import PictureProcessor from "./graphics/pictureProcessor"
import { SerialPort } from "./serialConnections/serialPort"
import { DebugConnection } from "./serialConnections/debugConnection"
import SuperEmulator from "./super/superEmulator"
import { DebugMap } from "./debug/types"
import { StoredGame } from "../web/indexedDb/storedGame"

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
  colouriseDmg: boolean
  debugMap: DebugMap
  storedGame: StoredGame

  constructor(
    cartridge: Cartridge,
    mode: EmulatorMode,
    colouriseDmg: boolean = false,
    debugMap: DebugMap | undefined = undefined,
    storedGame: StoredGame,
    borderEnabled: boolean = false
  ) {
    this.mode = mode
    this.serialPort = { type: "debug", connection: new DebugConnection() }
    if (this.mode === EmulatorMode.SGB) {
      this.superEmulator = new SuperEmulator(borderEnabled)
    }
    this.memory = new Memory(cartridge, this.mode, this.serialPort, this.superEmulator)
    this.controller = new Controller(this.memory)
    this.cpu = new CPU(this.memory, this.controller, this.serialPort, mode)
    this.pictureProcessor = new PictureProcessor(this.cpu, mode, colouriseDmg, this.superEmulator)
    this.audioProcessor = new AudioProcessor(this.cpu)
    this.controller.initialiseEvents()
    this.colouriseDmg = colouriseDmg
    this.debugMap = debugMap
    this.storedGame = storedGame

    if (storedGame.breakpoints) {
      console.log("Found breakpoints", storedGame.breakpoints)
      this.cpu.breakpoints = new Set(storedGame.breakpoints.map(([_bank, address]) => address))
    } else {
      console.log("No breakpoints :(")
    }

    const paletteString = window.localStorage.getItem("monochromePalette")
    if (paletteString) {
      const palette = JSON.parse(paletteString)
      this.pictureProcessor.scanlineRenderer.colours = palette
    }
  }
}
