import { Instruction } from "./instruction"

const halt: Instruction = {
  execute: (cpu) => {
    cpu.isHalted = true
  },
  cycles: 4,
  parameterBytes: 0,
  description: () => "HALT",
  length: 1,
  toCode() {
    return "halt"
  }
}

export default halt
