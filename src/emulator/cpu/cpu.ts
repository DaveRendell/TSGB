import AudioProcessor from "../audio/audioProcessor"
import Controller from "../controller"
import { CpuRegisters } from "./cpuRegisters"
import { decodeInstruction } from "./instructions/instruction"
import { splitBytes } from "./instructions/instructionHelpers"
import nop from "./instructions/nop"
import Memory from "../memory/memoryMap"
import { Interrupt } from "../memory/registers/interruptRegisters"
import { ByteRef, GetSetByteRef } from "../refs/byteRef"
import { WordRef } from "../refs/wordRef"
import PictureProcessor from "../graphics/pictureProcessor"
import Timer from "../timer"
import { addressDisplay } from "../../helpers/displayHexNumbers"
import { EmulatorMode } from "../emulator"

interface ClockCallback {
  updateClock(cycles: number): void
}

const INTERRUPT_HANDLERS: Record<Interrupt, number> = {
  [Interrupt.VBlank]: 0x0040,
  [Interrupt.LCD]: 0x0048,
  [Interrupt.Timer]: 0x0050,
  [Interrupt.Serial]: 0x0058,
  [Interrupt.Joypad]: 0x0060,
}

const FRAME_TIME_MS = 1000 / 60

export default class CPU {
  running = false

  memory: Memory
  registers: CpuRegisters
  controller: Controller
  mode: EmulatorMode
  cycleCount: number = 0
  interruptsEnabled = false
  pictureProcessor: PictureProcessor
  audioProcessor: AudioProcessor
  recentFrames: number[] = []
  recentFrameTimes: number[] = []
  averageRecentFrameTime = 0
  fps = 0
  timer: Timer

  isHalted = false
  isStopped = false
  debugMode = false
  breakpoints: Set<number> = new Set()

  onInstructionComplete: () => void = () => {}
  onError: (error: Error) => void = () => {}
  clockCallbacks: ClockCallback[] = []

  interruptEnableRegister: ByteRef
  interruptFlags: ByteRef

  gbDoctorLog = ""

  nextByte: ByteRef
  nextWord: WordRef

  instructions: { [code: number]: (cpu: CPU) => void } = {}
  cycleLengths: { [code: number]: number } = {}

  prefixedInstructions: { [code: number]: (cpu: CPU) => void } = {}
  prefixedCycleLengths: { [code: number]: number } = {}

  constructor(memory: Memory, controller: Controller, mode: EmulatorMode) {
    this.mode = mode
    this.memory = memory
    this.controller = controller
    memory.cpu = this
    this.registers = new CpuRegisters()
    this.timer = new Timer(memory)
    this.addClockCallback(this.timer)

    this.interruptEnableRegister = memory.at(0xffff)
    this.interruptFlags = memory.at(0xff0f)

    const self = this

    this.nextByte =  new GetSetByteRef(
      () => memory.at(self.registers.PC.word++).byte,
      () => {}
    )

    this.nextWord = {
      get word(): number {
        const l = memory.at(self.registers.PC.word++).byte
        const h = memory.at(self.registers.PC.word++).byte
        return (h << 8) + l
      },
    }

    for (let code = 0x00; code < 0x100; code++) {
      try {
        const instruction = decodeInstruction(this, code)
        this.instructions[code] = instruction.execute
        this.cycleLengths[code] = instruction.cycles
      } catch {
        this.instructions[code] = nop.execute
        this.cycleLengths[code] = 4
      }
      try {
        const instruction = decodeInstruction(this, 0xCB, code)
        this.prefixedInstructions[code] = instruction.execute
        this.prefixedCycleLengths[code] = instruction.cycles
      } catch {
        this.instructions[code] = nop.execute
        this.cycleLengths[code] = 4
      }
    }


    // SKIP BOOTROM
    if (mode == EmulatorMode.DMG) {
      this.registers.A.byte = 0x01
      this.registers.F.byte = 0xb0
      this.registers.B.byte = 0x00
      this.registers.C.byte = 0x13
      this.registers.D.byte = 0x00
      this.registers.E.byte = 0xd8
      this.registers.H.byte = 0x01
      this.registers.L.byte = 0x4d
      this.registers.SP.word = 0xfffe
      this.registers.PC.word = 0x0100
    } else if (mode == EmulatorMode.CGB) {
      this.registers.A.byte = 0x11
      this.registers.F.byte = 0xb0
      this.registers.B.byte = 0x00
      this.registers.C.byte = 0x13
      this.registers.D.byte = 0xFF
      this.registers.E.byte = 0xd8
      this.registers.H.byte = 0x00
      this.registers.L.byte = 0x0D
      this.registers.SP.word = 0xfffe
      this.registers.PC.word = 0x0100
    }
  }

  createGbDoctorLog() {
    // GB Doctor logging
    const A = this.registers.A.byte.toString(16).padStart(2, "0").toUpperCase()
    const B = this.registers.B.byte.toString(16).padStart(2, "0").toUpperCase()
    const C = this.registers.C.byte.toString(16).padStart(2, "0").toUpperCase()
    const D = this.registers.D.byte.toString(16).padStart(2, "0").toUpperCase()
    const E = this.registers.E.byte.toString(16).padStart(2, "0").toUpperCase()
    const F = this.registers.F.byte.toString(16).padStart(2, "0").toUpperCase()
    const H = this.registers.H.byte.toString(16).padStart(2, "0").toUpperCase()
    const L = this.registers.L.byte.toString(16).padStart(2, "0").toUpperCase()
    const SP = this.registers.SP.word
      .toString(16)
      .padStart(4, "0")
      .toUpperCase()
    const PC = this.registers.PC.word
      .toString(16)
      .padStart(4, "0")
      .toUpperCase()
    const PCMEM = [
      this.memory.at(this.registers.PC.word + 0).byte,
      this.memory.at(this.registers.PC.word + 1).byte,
      this.memory.at(this.registers.PC.word + 2).byte,
      this.memory.at(this.registers.PC.word + 3).byte,
    ]
      .map((x) => x.toString(16).padStart(2, "0").toUpperCase())
      .join(",")
    this.gbDoctorLog += `A:${A} F:${F} B:${B} C:${C} D:${D} E:${E} H:${H} L:${L} SP:${SP} PC:${PC} PCMEM:${PCMEM}\n`
  }

  executeInstruction(): void {
    if (this.isHalted) {
      this.incrementClock(4)
    } else {
      const code = this.nextByte.byte

      if (code != 0xcb) {
        this.instructions[code](this)
        this.incrementClock(this.cycleLengths[code])
      } else {
        const prefixedCode = this.nextByte.byte
        this.prefixedInstructions[prefixedCode](this)
        this.incrementClock(this.prefixedCycleLengths[prefixedCode])
      }
    }    

    const interrupt = this.getInterrupt()
    if (interrupt !== null) {
      if (this.isHalted && !this.interruptsEnabled) {
        this.isHalted = false
      } else {
        this.handleInterrupt(interrupt)
      }
    }

    if (this.breakpoints.has(this.registers.PC.word)) {
      this.running = false
    }
  }

  getInterrupt(): Interrupt | null {
    if (!(this.interruptsEnabled || this.isHalted)) {
      return null
    }
    const activeInterrupts =
      this.interruptEnableRegister.byte & this.interruptFlags.byte

    if (activeInterrupts === 0) {
      return null
    }

    // Find id of highest priority interrupt
    let id = 0
    while (((activeInterrupts >> id) & 1) === 0) {
      id++
    }

    return id as Interrupt
  }

  handleInterrupt(interrupt: Interrupt): void {
    this.isHalted = false

    this.interruptFlags.byte = this.interruptFlags.byte & ~(1 << interrupt)
    // Push PC to stack and jump to handler address
    const handlerAddress = INTERRUPT_HANDLERS[interrupt]
    const sp = this.registers.SP
    const pc = this.registers.PC
    const [h, l] = splitBytes(pc.word)

    this.memory.at(--sp.word).byte = h
    this.memory.at(--sp.word).byte = l
    pc.word = handlerAddress

    this.incrementClock(20)
    this.interruptsEnabled = false
  }

  incrementClock(cycles: number) {
    this.cycleCount += cycles
    this.clockCallbacks.forEach((callback) => callback.updateClock(cycles))
  }

  run() {
    this.running = true
    this.audioProcessor.startAudio()
    requestAnimationFrame((timestamp) => this.runBrowserFrame(timestamp))
  }

  pause() {
    this.running = false
    this.audioProcessor.stopAudio()
  }

  runFrame(timestamp: number): void {
    const startTime = Date.now()
    // We maintain an FPS counter by keeping track of how many frames were run
    // over the last 1000ms
    this.recentFrames = this.recentFrames.filter(
      (frame) => timestamp - frame < 1000,
    )
    this.fps = this.recentFrames.push(timestamp)

    this.controller.update()

    this.pictureProcessor.newFrameDrawn = false
    while (!this.pictureProcessor.newFrameDrawn) {
      this.executeInstruction()
    }

    if (this.running) {
      requestAnimationFrame((timestamp) => this.runFrame(timestamp))
    }

    const endTime = Date.now()
    const timeTaken = endTime - startTime
    this.recentFrameTimes.push(timeTaken)
    this.averageRecentFrameTime += timeTaken
    if (this.recentFrameTimes.length > 60) {
      const [removed] = this.recentFrameTimes.splice(0, 1)
      this.averageRecentFrameTime -= removed
    }
  }

  lastEmulatorFrame: number = 0

  runBrowserFrame(timestamp: number): void {
    this.controller.update()

    const timeSinceLastEmulatorFrame = timestamp - this.lastEmulatorFrame

    const percentageThroughEmulatorFrame = timeSinceLastEmulatorFrame / FRAME_TIME_MS

    if (percentageThroughEmulatorFrame > 0.95) {
      this.pictureProcessor.newFrameDrawn = false
      while (!this.pictureProcessor.newFrameDrawn) {
        this.executeInstruction()
      }
      this.lastEmulatorFrame = timestamp
    } else {
      const targetScanline = percentageThroughEmulatorFrame * 144
      const scanline = this.memory.registers.scanline
      while (scanline.byte >= 144 || scanline.byte < targetScanline) {
        this.executeInstruction()
      }
    }
    
    if (this.running) {
      requestAnimationFrame((timestamp) => this.runBrowserFrame(timestamp))
    }
  }

  addClockCallback(callback: ClockCallback): void {
    this.clockCallbacks.push(callback)
  }

  printStack(size: number): string {
    let stackPointer = this.registers.SP.word
    let stack: number[] = []

    for (let i = 0; i < size; i++) {
      const l = this.memory.at(stackPointer++).byte
      const h = this.memory.at(stackPointer++).byte
      stack.push((h << 8) + l)
    }

    return stack.map(addressDisplay).join("\n")
  }
}
