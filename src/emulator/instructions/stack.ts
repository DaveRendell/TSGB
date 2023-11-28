import { addressDisplay } from "../../helpers/displayHexNumbers";
import { Register16Name } from "../../types";
import { decrement, increment } from "../arithmetic";
import { Instruction } from "../instruction";
import { combineBytes, splitBytes } from "./instructionHelpers";

export const call: Instruction = {
  execute: (cpu) => {
    const sp = cpu.registers.get16("SP")
    const pc = cpu.registers.get16("PC")
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
    const pc = cpu.registers.get16("PC")

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

export function push(registerName: Register16Name): Instruction {
  return {
    execute: (cpu) => {
      const sp = cpu.registers.get16("SP")
      const register = cpu.registers.get16(registerName)

      const [h, l] = splitBytes(register.read())
      console.log([h, l])

      decrement(sp)
      cpu.memory.at(sp.read()).write(h)
      console.log(sp.read())
      console.log(cpu.memory.at(sp.read()).read())
      decrement(sp)
      console.log(sp.read())
      cpu.memory.at(sp.read()).write(l)
      console.log(cpu.memory.at(sp.read()).read())
    },
    cycles:  16,
    parameterBytes: 0,
    description: () => `PUSH ${registerName}`
  }
}

export function pop(registerName: Register16Name): Instruction {
  return {
    execute: (cpu) => {
      const sp = cpu.registers.get16("SP")
      const register = cpu.registers.get16(registerName)

      const l = cpu.memory.at(sp.read()).read()
      increment(sp)
      const h = cpu.memory.at(sp.read()).read()
      increment(sp)

      register.write(combineBytes(h, l))
    },
    cycles:  12,
    parameterBytes: 0,
    description: () => `POP ${registerName}`
  }
}