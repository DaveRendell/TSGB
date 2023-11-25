import Memory from "./memory";
import CpuRegisters from "./register";

export default class CPU {
  memory: Memory
  registers: CpuRegisters
  onInstructionComplete: () => void = () => {}

  constructor(memory: Memory, registers: CpuRegisters) {
    this.memory = memory
    this.registers = registers
  }

  executeNextInstruction(): void {
    console.log("QQ")
    this.onInstructionComplete()
  }
}