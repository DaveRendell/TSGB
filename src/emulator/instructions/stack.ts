import { addressDisplay } from "../../helpers/displayHexNumbers";
import { decrement, increment } from "../arithmetic";
import { Instruction } from "../instruction";
import { combineBytes, splitBytes } from "./instructionHelpers";

export const call: Instruction = {
  execute: (cpu) => {
    const sp = cpu.registers.get16("SP")
    const pc = cpu.registers.get16("SP")
    const address = cpu.readNext16bit()

    const [h, l] = splitBytes(pc.read())

    decrement(sp)
    cpu.memory.at(sp.read()).write(h)
    decrement(sp)
    cpu.memory.at(sp.read()).write(l)

    pc.write(address)
  },
  cycles: 24,
  parameterBytes: 2,
  description: ([l, h]) => `CALL ${addressDisplay(combineBytes(h, l))}`
}

export const ret: Instruction = {
  execute: (cpu) => {
    const sp = cpu.registers.get16("SP")
    const pc = cpu.registers.get16("SP")

    const l = cpu.memory.at(sp.read()).read()
    increment(sp)
    const h = cpu.memory.at(sp.read()).read()
    increment(sp)

    pc.write(combineBytes(h, l))
  },
  cycles: 16,
  parameterBytes: 0,
  description: () => "RET"
}