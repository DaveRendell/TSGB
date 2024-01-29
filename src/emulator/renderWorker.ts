import DmgScanlineRenderer from "./dmgScanlineRenderer"
import { OAM } from "./memory/oam"
import { IoRegisters } from "./memory/registers/ioRegisters"
import { VRAM } from "./memory/vram"

const registers = new IoRegisters()
const vram = new VRAM()
const oam = new OAM(registers, vram)

const renderer = new DmgScanlineRenderer(registers, vram, oam)

self.addEventListener("message", (e) => {
  console.log("received message", e.data)
})