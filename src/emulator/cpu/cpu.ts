import AudioProcessor from "../audio/audioProcessor"
import Controller from "../controller"
import { CpuRegisters } from "./cpuRegisters"
import { Instruction, decodeInstruction } from "./instructions/instruction"
import { splitBytes } from "./instructions/instructionHelpers"
import nop from "./instructions/nop"
import Memory from "../memory/memoryMap"
import { Interrupt } from "../memory/registers/interruptRegisters"
import { ByteRef } from "../refs/byteRef"
import { WordRef } from "../refs/wordRef"
import PictureProcessor from "../pictureProcessor"
import Timer from "../timer"

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

export default class CPU {
  running = false

  memory: Memory
  registers: CpuRegisters
  controller: Controller
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

  constructor(memory: Memory, controller: Controller) {
    this.memory = memory
    this.controller = controller
    memory.cpu = this
    this.registers = new CpuRegisters()
    this.timer = new Timer(memory)
    this.addClockCallback(this.timer)

    this.interruptEnableRegister = memory.at(0xffff)
    this.interruptFlags = memory.at(0xff0f)

    const self = this

    this.nextByte = {
      get value(): number {
        return memory.at(self.registers.PC.value++).value
      },
      set value(_: number) {},
    }

    this.nextWord = {
      get value(): number {
        const l = memory.at(self.registers.PC.value++).value
        const h = memory.at(self.registers.PC.value++).value
        return (h << 8) + l
      },
    }

    // SKIP BOOTROM
    this.registers.A.value = 0x01
    this.registers.F.value = 0xb0
    this.registers.B.value = 0x00
    this.registers.C.value = 0x13
    this.registers.D.value = 0x00
    this.registers.E.value = 0xd8
    this.registers.H.value = 0x01
    this.registers.L.value = 0x4d
    this.registers.SP.value = 0xfffe
    this.registers.PC.value = 0x0100
  }

  createGbDoctorLog() {
    // GB Doctor logging
    const A = this.registers.A.value.toString(16).padStart(2, "0").toUpperCase()
    const B = this.registers.B.value.toString(16).padStart(2, "0").toUpperCase()
    const C = this.registers.C.value.toString(16).padStart(2, "0").toUpperCase()
    const D = this.registers.D.value.toString(16).padStart(2, "0").toUpperCase()
    const E = this.registers.E.value.toString(16).padStart(2, "0").toUpperCase()
    const F = this.registers.F.value.toString(16).padStart(2, "0").toUpperCase()
    const H = this.registers.H.value.toString(16).padStart(2, "0").toUpperCase()
    const L = this.registers.L.value.toString(16).padStart(2, "0").toUpperCase()
    const SP = this.registers.SP.value
      .toString(16)
      .padStart(4, "0")
      .toUpperCase()
    const PC = this.registers.PC.value
      .toString(16)
      .padStart(4, "0")
      .toUpperCase()
    const PCMEM = [
      this.memory.at(this.registers.PC.value + 0).value,
      this.memory.at(this.registers.PC.value + 1).value,
      this.memory.at(this.registers.PC.value + 2).value,
      this.memory.at(this.registers.PC.value + 3).value,
    ]
      .map((x) => x.toString(16).padStart(2, "0").toUpperCase())
      .join(",")
    this.gbDoctorLog += `A:${A} F:${F} B:${B} C:${C} D:${D} E:${E} H:${H} L:${L} SP:${SP} PC:${PC} PCMEM:${PCMEM}\n`
  }

  executeNextInstruction(): void {
    // this.createGbDoctorLog()
    if (this.isHalted) {
      this.incrementClock(4)
      return
    }

    const code = this.nextByte.value
    const prefixedCode = code === 0xcb ? this.nextByte.value : undefined
    let instruction: Instruction
    try {
      instruction = decodeInstruction(code, prefixedCode)
    } catch {
      console.warn(
        `Unused opcode: ${code.toString(
          16,
        )} at address ${this.registers.PC.value.toString(16)}`,
      )
      instruction = nop
    }

    instruction.execute(this)
    this.incrementClock(instruction.cycles)

    if (this.debugMode) {
      const parameters = new Array(instruction.parameterBytes)
        .fill(0)
        .map((_, i) => this.memory.at(this.registers.PC.value + 1 + i).value)
      console.log(instruction.description(parameters))
    }

    this.onInstructionComplete()
  }

  getInterrupt(): Interrupt | null {
    if (!this.interruptsEnabled) {
      return null
    }
    const activeInterrupts =
      this.interruptEnableRegister.value & this.interruptFlags.value

    if (activeInterrupts === 0) {
      return null
    }

    // Find id of highest priority interrupt
    let id = 0
    while (((activeInterrupts >> id) & 1) === 0) {
      id++
    }

    this.interruptFlags.value = this.interruptFlags.value & ~(1 << id)

    return id as Interrupt
  }

  handleInterrupt(interrupt: Interrupt): void {
    this.isHalted = false
    // console.log(`Handling ${interrupt} interrupt - calling ${INTERRUPT_HANDLERS[interrupt]}`)
    // Push PC to stack and jump to handler address
    const handlerAddress = INTERRUPT_HANDLERS[interrupt]
    const sp = this.registers.SP
    const pc = this.registers.PC

    const [h, l] = splitBytes(pc.value)

    this.memory.at(--sp.value).value = h
    this.memory.at(--sp.value).value = l
    pc.value = handlerAddress

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
    requestAnimationFrame((timestamp) => this.runFrame(timestamp))
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

    let address = 0

    this.controller.update()

    // try {
    frameLoop: while (!this.breakpoints.has(this.registers.PC.value)) {
      this.executeNextInstruction()
      address = this.registers.PC.value

      const interrupt = this.getInterrupt()
      if (interrupt !== null) {
        this.handleInterrupt(interrupt)
      }

      if (this.pictureProcessor.newFrameDrawn) {
        this.pictureProcessor.newFrameDrawn = false
        break frameLoop
      }
    }
    if (this.running && !this.breakpoints.has(address)) {
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
    // } catch (error) {
    //   console.log(error.stack)
    //   this.running = false
    //   this.onError(error)
    // }
  }

  addClockCallback(callback: ClockCallback): void {
    this.clockCallbacks.push(callback)
  }
}
