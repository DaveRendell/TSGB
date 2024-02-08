import { Instruction } from "./instruction"

const halt: Instruction = {
  execute: (cpu) => {
    cpu.isHalted = true
  },
  cycles: 4,
  parameterBytes: 0,
  description: () => "HALT",
}

export default halt
