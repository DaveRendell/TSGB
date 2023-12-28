import APU from "./apu";
import Controller from "./controller";
import CPU from "./cpu";
import Memory from "./memory";
import { Cartridge } from "./memory/cartridges/cartridge"
import Screen from "./screen"

export class Emulator {
  memory: Memory
  cpu: CPU
  screen: Screen
  apu: APU
  controller: Controller

  constructor(cartridge: Cartridge) {
    this.memory = new Memory(cartridge)
    this.cpu = new CPU(this.memory)
    this.screen = new Screen(this.cpu)
    this.apu = new APU(this.cpu)
    this.controller = new Controller(this.memory)
    this.controller.initialiseEvents()
  }
}