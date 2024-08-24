import { Instruction } from "./instruction"

const nop: Instruction = {
  execute: (_) => {},
  cycles: 4,
  parameterBytes: 0,
  description: () => "NOP",
  length: 1,
}

export default nop
