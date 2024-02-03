import DmgScanlineRenderer from "../dmgScanlineRenderer"
import { OAM } from "../memory/oam"
import { VRAM } from "../memory/vram"
import ScanlineRenderer from "../scanlineRenderer"
import { Message, MessageType } from "./message"
import { WorkerRegisters } from "./workerRegisters"

const registers = new WorkerRegisters()
let vram: VRAM | undefined = undefined
let oam: OAM | undefined = undefined

let renderer: ScanlineRenderer | undefined = undefined

let startTime = 0

let memUpdates = 0

self.addEventListener("message", (e) => {
  const message = e.data as Message
  switch (message.type) {
    case MessageType.MemoryWrite:
      registers.at(message.address).byte = message.value
      memUpdates++
      // if (memUpdates > 100) {
      //   console.log(message)
      // }
      break
    case MessageType.RenderScanline:
      renderer.renderScanline()
      break
    case MessageType.RenderScreen:
      renderer.renderScreen()
      renderer.windowLine = 0
      const time = Date.now()
      postMessage(time - startTime)
      memUpdates = 0
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
      break
    case MessageType.ShareMemory:
      vram = new VRAM(message.vramData)
      oam  = new OAM(registers, vram, message.oamData)
      renderer = new DmgScanlineRenderer(registers, vram, oam)
      console.log("Renderer set up")
      break
  }
})