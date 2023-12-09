import { Interrupt, MutableValue } from "../types";
import APU from "./apu";
import { CpuRegisters } from "./cpu/cpuRegisters";
import { decodeInstruction } from "./instruction";
import { resetBit, splitBytes } from "./instructions/instructionHelpers";
import Memory from "./memory";
import { ByteRef } from "./refs/byteRef";
import { WordRef } from "./refs/wordRef";
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
  
  nextByte: ByteRef
  nextWord: WordRef

  constructor(memory: Memory) {
    this.memory = memory
    this.registers = new CpuRegisters()
    this.timer = new Timer(memory)
    this.addClockCallback(this.timer)

    this.interruptEnableRegister = memory.atOldQQ(0xFFFF)
    this.interruptFlags = memory.atOldQQ(0xFF0F)

    const self = this

    this.nextByte = {
      get value(): number {
        return memory.at(self.registers.PC.value++).value
      },
      set value(_: number) {}
    }

    this.nextWord = {
      get value(): number {
        const l = memory.at(self.registers.PC.value++).value
        const h = memory.at(self.registers.PC.value++).value
        return (h << 8) + l
      }
    }

    // SKIP BOOTROM
    this.registers.A.value = 0x01
    this.registers.F.value = 0xB0
    this.registers.B.value = 0x00
    this.registers.C.value = 0x13
    this.registers.D.value = 0x00
    this.registers.E.value = 0xD8
    this.registers.H.value = 0x01
    this.registers.L.value = 0x4D
    this.registers.SP.value = 0xFFFE
    this.registers.PC.value = 0x0100
  }

  createGbDoctorLog() {
    // // GB Doctor logging
    // const A = this.registersOldQQ.get8oldQQ("A").read().toString(16).padStart(2, "0").toUpperCase()
    // const B = this.registersOldQQ.get8oldQQ("B").read().toString(16).padStart(2, "0").toUpperCase()
    // const C = this.registersOldQQ.get8oldQQ("C").read().toString(16).padStart(2, "0").toUpperCase()
    // const D = this.registersOldQQ.get8oldQQ("D").read().toString(16).padStart(2, "0").toUpperCase()
    // const E = this.registersOldQQ.get8oldQQ("E").read().toString(16).padStart(2, "0").toUpperCase()
    // const F = this.registersOldQQ.get8oldQQ("F").read().toString(16).padStart(2, "0").toUpperCase()
    // const H = this.registersOldQQ.get8oldQQ("H").read().toString(16).padStart(2, "0").toUpperCase()
    // const L = this.registersOldQQ.get8oldQQ("L").read().toString(16).padStart(2, "0").toUpperCase()
    // const SP = this.registersOldQQ.oldQQ("SP").read().toString(16).padStart(4, "0").toUpperCase()
    // const PC = this.registersOldQQ.oldQQ("PC").read().toString(16).padStart(4, "0").toUpperCase()
    // const PCMEM = [
    //   this.memory.atOldQQ(this.registersOldQQ.oldQQ("PC").read() + 0).read(),
    //   this.memory.atOldQQ(this.registersOldQQ.oldQQ("PC").read() + 1).read(),
    //   this.memory.atOldQQ(this.registersOldQQ.oldQQ("PC").read() + 2).read(),
    //   this.memory.atOldQQ(this.registersOldQQ.oldQQ("PC").read() + 3).read(),
    // ].map(x => x.toString(16).padStart(2, "0").toUpperCase()).join(",")
    // this.gbDoctorLog +=
    //   `A:${A} F:${F} B:${B} C:${C} D:${D} E:${E} H:${H} L:${L} SP:${SP} PC:${PC} PCMEM:${PCMEM}\n`

  }

  executeNextInstruction(): void {
    if (this.isHalted) {
      this.incrementClock(4)
      return
    }

    const code = this.nextByte.value
    const prefixedCode = code === 0xCB ? this.nextByte.value : undefined
    const instruction = decodeInstruction(code, prefixedCode)

    instruction.execute(this)
    this.incrementClock(instruction.cycles)

    if (this.debugMode) {
      const parameters = new Array(instruction.parameterBytes)
        .fill(0)
        .map((_, i) => this.memory.atOldQQ(this.registers.PC.value + 1 + i).read())
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
    // console.log(`Handling ${interrupt} interrupt - calling ${INTERRUPT_HANDLERS[interrupt]}`)
    // Push PC to stack and jump to handler address
    const handlerAddress = INTERRUPT_HANDLERS[interrupt]
    const sp = this.registers.SP
    const pc = this.registers.PC

    const [h, l] = splitBytes(pc.value)

    sp.value--
    this.memory.atOldQQ(sp.value).write(h)
    sp.value--
    this.memory.atOldQQ(sp.value).write(l)
    pc.value = handlerAddress

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
    
    // try {
      frameLoop:
      while (!this.breakpoints.has(address)) {
        this.executeNextInstruction()
        address = this.registers.PC.value

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