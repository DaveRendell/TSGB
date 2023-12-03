import { addressDisplay } from "../../helpers/displayHexNumbers";
import { JumpCondition, Register16Name } from "../../types";
import { decrement, increment } from "../arithmetic";
import { Instruction } from "../instruction";
import { combineBytes, splitBytes } from "./instructionHelpers";
import { CONDITIONS, CONDITION_NAMES } from "./jumps";

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

export function callF(condition: JumpCondition): Instruction {
  return {
    execute(cpu) {
      const address = cpu.readNext16bit()
      if (CONDITIONS[condition](cpu)) {
        const sp = cpu.registers.get16("SP")
        const pc = cpu.registers.get16("PC")

        const [h, l] = splitBytes(pc.read())

        decrement(sp)
        cpu.memory.at(sp.read()).write(h)
        decrement(sp)
        cpu.memory.at(sp.read()).write(l)

        pc.write(address)
      }
    },
    cycles: 24,
    parameterBytes: 2,
    description: ([l, h]) => `CALL ${CONDITION_NAMES[condition]},${addressDisplay(combineBytes(h, l))}`
  }
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

export const reti: Instruction = {
  execute(cpu) {
    const sp = cpu.registers.get16("SP")
    const pc = cpu.registers.get16("PC")

    const l = cpu.memory.at(sp.read()).read()
    increment(sp)
    const h = cpu.memory.at(sp.read()).read()
    increment(sp)

    pc.write(combineBytes(h, l))
    cpu.interruptsEnabled = true
  },
  cycles: 16,
  parameterBytes: 0,
  description: () => "RETI"
}

export function retF(condition: JumpCondition): Instruction {
  return {
    execute(cpu) {
      if (CONDITIONS[condition](cpu)) {
        const sp = cpu.registers.get16("SP")
        const pc = cpu.registers.get16("PC")

        const l = cpu.memory.at(sp.read()).read()
        increment(sp)
        const h = cpu.memory.at(sp.read()).read()
        increment(sp)

        pc.write(combineBytes(h, l))
      }
    },
    cycles: 20,
    parameterBytes: 0,
    description: () => `RET ${CONDITION_NAMES[condition]}`
  }
}

export function push(registerName: Register16Name): Instruction {
  return {
    execute: (cpu) => {
      const sp = cpu.registers.get16("SP")
      const register = cpu.registers.get16(registerName)

      const [h, l] = splitBytes(register.read())

      decrement(sp)
      cpu.memory.at(sp.read()).write(h)
      decrement(sp)
      cpu.memory.at(sp.read()).write(l)
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