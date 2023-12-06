import { Interrupt, MutableValue, ReadableValue } from "../types";
import APU from "./apu";
import { decrement, increment } from "./arithmetic";
import { decodeInstruction } from "./instruction";
import { resetBit, splitBytes } from "./instructions/instructionHelpers";
import Memory from "./memory";
import CpuRegisters from "./register";
import Screen from "./screen"
import Timer from "./timer";

interface ClockCallback { updateClock(cycles: number): void }

const INTERRUPT_HANDLERS: Record<Interrupt, number> = {
  "VBlank": 0x0040,
  "LCD": 0x0048,
  "Timer": 0x0050,
  "Joypad": 0x0060,
}

const INTERRUPTS: Interrupt[] = ["VBlank"]

export default class CPU {
  running = false

  memory: Memory
  registers: CpuRegisters
  cycleCount: number = 0
  interruptsEnabled = false
  screen: Screen
  apu: APU
  recentFrames: number[] = []
  fps = 0
  timer: Timer

  isHalted = false
  isStopped = false
  debugMode = false
  breakpoints: Set<number> = new Set()

  onInstructionComplete: () => void = () => {}
  onError: (error: Error) => void = () => {}
  clockCallbacks: ClockCallback[] = []

  interruptEnableRegister: MutableValue<8>
  interruptFlags: MutableValue<8>

  gbDoctorLog = ""

  constructor(memory: Memory, registers: CpuRegisters) {
    this.memory = memory
    this.registers = registers
    this.timer = new Timer(memory)
    this.addClockCallback(this.timer)

    this.interruptEnableRegister = memory.at(0xFFFF)
    this.interruptFlags = memory.at(0xFF0F)

    // if (!this.memory.bootRomLoaded) {
    //   this.registers.get8("A").write(0x01)
    //   this.registers.get8("F").write(0xB0)
    //   this.registers.get8("B").write(0x00)
    //   this.registers.get8("C").write(0x13)
    //   this.registers.get8("D").write(0x00)
    //   this.registers.get8("E").write(0xD8)
    //   this.registers.get8("H").write(0x01)
    //   this.registers.get8("L").write(0x4D)
    //   this.registers.get16("SP").write(0xFFFE)
    //   this.registers.get16("PC").write(0x0100)
    // }
  }

  nextByte: ReadableValue<8> = {
    intSize: 8,
    read: () => {
      const byte = this.memory.at(this.registers.get16("PC").read()).read()
      increment(this.registers.get16("PC"))
      return byte
    }
  }

  readNextByte(): number {
    const byte = this.memory.at(this.registers.get16("PC").read()).read()
    increment(this.registers.get16("PC"))
    return byte
  }

  readNext16bit(): number {
    const l = this.readNextByte()
    const h = this.readNextByte()
    return (h << 8) + l
  }

  createGbDoctorLog() {
    // GB Doctor logging
    const A = this.registers.get8("A").read().toString(16).padStart(2, "0").toUpperCase()
    const B = this.registers.get8("B").read().toString(16).padStart(2, "0").toUpperCase()
    const C = this.registers.get8("C").read().toString(16).padStart(2, "0").toUpperCase()
    const D = this.registers.get8("D").read().toString(16).padStart(2, "0").toUpperCase()
    const E = this.registers.get8("E").read().toString(16).padStart(2, "0").toUpperCase()
    const F = this.registers.get8("F").read().toString(16).padStart(2, "0").toUpperCase()
    const H = this.registers.get8("H").read().toString(16).padStart(2, "0").toUpperCase()
    const L = this.registers.get8("L").read().toString(16).padStart(2, "0").toUpperCase()
    const SP = this.registers.get16("SP").read().toString(16).padStart(4, "0").toUpperCase()
    const PC = this.registers.get16("PC").read().toString(16).padStart(4, "0").toUpperCase()
    const PCMEM = [
      this.memory.at(this.registers.get16("PC").read() + 0).read(),
      this.memory.at(this.registers.get16("PC").read() + 1).read(),
      this.memory.at(this.registers.get16("PC").read() + 2).read(),
      this.memory.at(this.registers.get16("PC").read() + 3).read(),
    ].map(x => x.toString(16).padStart(2, "0").toUpperCase()).join(",")
    this.gbDoctorLog +=
      `A:${A} F:${F} B:${B} C:${C} D:${D} E:${E} H:${H} L:${L} SP:${SP} PC:${PC} PCMEM:${PCMEM}\n`

  }

  executeNextInstruction(): void {
    if (this.isHalted) {
      this.incrementClock(4)
      return
    }

    const pc = this.registers.get16("PC").read()
    const code = this.readNextByte()
    const prefixedCode = code === 0xCB ? this.readNextByte() : undefined
    const instruction = decodeInstruction(code, prefixedCode)

    instruction.execute(this)
    this.incrementClock(instruction.cycles)

    if (this.debugMode) {
      const parameters = new Array(instruction.parameterBytes)
        .fill(0)
        .map((_, i) => this.memory.at(pc + 1 + i).read())
      console.log(instruction.description(parameters))
    }
    
    
    this.onInstructionComplete()
  }

  getInterrupt(): Interrupt | null {
    if (!this.interruptsEnabled) { return null }
    const activeInterrupts =
      this.interruptEnableRegister.read() & this.interruptFlags.read()
    
    if (activeInterrupts === 0) { return null }

    // Find id of highest priority interrupt
    let id = 0
    while ( ((activeInterrupts >> id) & 1) === 0) { id++ }

    resetBit(this.interruptFlags, id)

    return INTERRUPTS[id]
  }

  handleInterrupt(interrupt: Interrupt): void {
    console.log(`Handling ${interrupt} interrupt - calling ${INTERRUPT_HANDLERS[interrupt]}`)
    // Push PC to stack and jump to handler address
    const handlerAddress = INTERRUPT_HANDLERS[interrupt]
    const sp = this.registers.get16("SP")
    const pc = this.registers.get16("PC")

    const [h, l] = splitBytes(pc.read())

    decrement(sp)
    this.memory.at(sp.read()).write(h)
    decrement(sp)
    this.memory.at(sp.read()).write(l)
    pc.write(handlerAddress)

    this.incrementClock(20)
    this.interruptsEnabled = false
  }

  incrementClock(cycles: number) {
    this.cycleCount += cycles
    this.clockCallbacks.forEach(callback => callback.updateClock(cycles))
  }

  run() {
    this.running = true
    this.apu.startAudio()
    requestAnimationFrame(timestamp => this.runFrame(timestamp))
  }

  pause() {
    this.running = false
    this.apu.stopAudio()
  }

  runFrame(timestamp: number): void {
    // We maintain an FPS counter by keeping track of how many frames were run
    // over the last 1000ms
    this.recentFrames = this.recentFrames.filter(frame => timestamp - frame < 1000)
    this.fps = this.recentFrames.push(timestamp)
    
    let address = 0
    
    try {
      frameLoop:
      while (!this.breakpoints.has(address)) {
        this.executeNextInstruction()
        address = this.registers.get16("PC").read()

        const interrupt = this.getInterrupt()
        if (interrupt) {
          this.handleInterrupt(interrupt)
        }

        if (this.screen.newFrameDrawn) {
          this.screen.newFrameDrawn = false
          break frameLoop
        }
      }
      if (this.running && !this.breakpoints.has(address)) {
        requestAnimationFrame(timestamp => this.runFrame(timestamp))
      }
    } catch (error) {
      console.trace()
      this.running = false
      this.onError(error)
    }    
  }

  addClockCallback(callback: ClockCallback): void {
    this.clockCallbacks.push(callback)
  }
}