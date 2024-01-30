import DmgScanlineRenderer from "../dmgScanlineRenderer"
import { OAM } from "../memory/oam"
import { VRAM } from "../memory/vram"
import { Message, MessageType } from "./message"
import { WorkerRegisters } from "./workerRegisters"

const registers = new WorkerRegisters
const vram = new VRAM()
const oam = new OAM(registers, vram)

const renderer = new DmgScanlineRenderer(registers, vram, oam)

let startTime = 0

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
      renderer.windowLine = 0
      const time = Date.now()
      postMessage(time - startTime)
      console.log(time - startTime)
      break
    case MessageType.SetCanvas:
      renderer.canvas = message.canvas
      break
    case MessageType.SetMonochromePalette:
      // TODO
      renderer.colours = message.palette
      break
    case MessageType.IncrementWindowLine:
      renderer.windowLine++
      break
    case MessageType.FrameStart:
      startTime = message.startTime
  }
})