import DmgScanlineRenderer from "../dmgScanlineRenderer"
import { OAM } from "../memory/oam"
import { VRAM } from "../memory/vram"
import { Message, MessageType } from "./message"
import { WorkerRegisters } from "./workerRegisters"

const registers = new WorkerRegisters
const vram = new VRAM()
const oam = new OAM(registers, vram)

const renderer = new DmgScanlineRenderer(registers, vram, oam)

self.addEventListener("message", (e) => {
  const message = e.data as Message
  switch (message.type) {
    case MessageType.MemoryWrite:
      if (message.address >= 0x8000 && message.address < 0xa000) {
        vram.at(message.address).byte = message.value
      } else if (message.address >= 0xfe00 && message.address < 0xfea0) {
        oam.at(message.address).byte = message.value
      } else {
        registers.at(message.address).byte = message.value
      }
    case MessageType.RenderScanline:
      renderer.renderScanline()
      break
    case MessageType.RenderScreen:
      renderer.renderScreen()
      break
    case MessageType.SetCanvas:
      // TODO as final step probably
      break
    case MessageType.SetMonochromePalette:
      // TODO
      renderer.colours = message.palette
      break
  }
})