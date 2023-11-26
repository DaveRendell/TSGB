import { increment } from "./arithmetic";
import { decodeInstruction } from "./instruction";
import Memory from "./memory";
import CpuRegisters from "./register";

export default class CPU {
  memory: Memory
  registers: CpuRegisters
  cycleCount: number = 0

  isHalted = false
  debugMode = true
  breakpoints: Set<number> = new Set()

  onInstructionComplete: () => void = () => {}

  constructor(memory: Memory, registers: CpuRegisters) {
    this.memory = memory
    this.registers = registers
  }

  readNextByte(): number {
    const byte = this.memory.at(this.registers.get16("PC").read()).read()
    increment(this.registers.get16("PC"))
    return byte
  }

  executeNextInstruction(): void {
    const pc = this.registers.get16("PC").read()
    const code = this.readNextByte()
    const instruction = decodeInstruction(code)

    instruction.execute(this)
    this.cycleCount += instruction.cycles

    if (this.debugMode) {
      const parameters = new Array(instruction.parameterBytes)
        .fill(0)
        .map((_, i) => this.memory.at(pc + 1 + i).read())
      console.log(instruction.description(parameters))
    }

    this.onInstructionComplete()
  }

  runUntilHalted(): Promise<void> {
    return new Promise((res) => {
      let address = 0
      while (!this.isHalted && !this.breakpoints.has(address)) {
        this.executeNextInstruction()
        address = this.registers.get16("PC").read()
      }
      res()
    })
  }
}