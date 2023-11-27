import { addressDisplay, valueDisplay } from "../../helpers/displayHexNumbers";
import { Register16Name, Register8Name, Target8Name } from "../../types";
import { decrement, increment } from "../arithmetic";
import { Instruction } from "../instruction";
import { combineBytes, get16BitRegister, getValue } from "./instructionHelpers";

export function loadImmediate8bitRegister(registerName: Register8Name): Instruction {
  return {
    execute: (cpu) => {
      cpu.registers.get8(registerName).write(cpu.readNextByte())
    },
    cycles: 8,
    parameterBytes: 1,
    description: ([value]) => `LD ${registerName},${valueDisplay(value)}`
  }
}

export function loadImmediate16BitRegister(registerName: Register16Name): Instruction {
  return {
    execute: (cpu) => {
      const l = cpu.readNextByte()
      const h = cpu.readNextByte()
      const target = get16BitRegister(registerName, cpu)
      target.write(combineBytes(h, l))
    },
    cycles: 12,
    parameterBytes: 2,
    description: ([l, h]) => `LD ${registerName},${addressDisplay(combineBytes(h, l))}`
  }
}

export const loadImmediateToMemory: Instruction = {
  execute: (cpu) => {
    const hl = cpu.registers.get16("HL")
    const memoryLocation = cpu.memory.at(hl.read())
    memoryLocation.write(cpu.readNextByte())
  },
  cycles: 12,
  parameterBytes: 1,
  description: ([value]) => `LD M,${valueDisplay(value)}`
}

export function loadBetweenLocations(
  destinationName: Target8Name,
  sourceName: Target8Name
): Instruction {
  return {
    execute: (cpu) => {
      const source = getValue(sourceName, cpu)
      const destination = getValue(destinationName, cpu)
      destination.write(source.read())
    },
    cycles: destinationName === "M" || sourceName === "M" ? 8 : 4,
    parameterBytes: 0,
    description: () => `LD ${destinationName},${sourceName}`
  }
}

export const loadFromMemoryIncrement: Instruction = {
  execute: (cpu) => {
    const hl = cpu.registers.get16("HL")
    const memoryLocation = cpu.memory.at(hl.read())
    cpu.registers.get8("A").write(memoryLocation.read())
    increment(hl)
  },
  cycles: 8,
  parameterBytes: 0,
  description: () => "LDI A,M"
}

export const loadToMemoryIncrement: Instruction = {
  execute: (cpu) => {
    const hl = cpu.registers.get16("HL")
    const memoryLocation = cpu.memory.at(hl.read())
    memoryLocation.write(cpu.registers.get8("A").read())
    increment(hl)
  },
  cycles: 8,
  parameterBytes: 0,
  description: () => "LDI M,A"
}

export const loadFromMemoryDecrement: Instruction = {
  execute: (cpu) => {
    const hl = cpu.registers.get16("HL")
    const memoryLocation = cpu.memory.at(hl.read())
    cpu.registers.get8("A").write(memoryLocation.read())
    decrement(hl)
  },
  cycles: 8,
  parameterBytes: 0,
  description: () => "LDD A,M"
}

export const loadToMemoryDecrement: Instruction = {
  execute: (cpu) => {
    const hl = cpu.registers.get16("HL")
    const memoryLocation = cpu.memory.at(hl.read())
    memoryLocation.write(cpu.registers.get8("A").read())
    decrement(hl)
  },
  cycles: 8,
  parameterBytes: 0,
  description: () => "LDD M,A"
}

export const loadToMemoryAtC: Instruction = {
  execute: (cpu) => {
    const address = 0xFF00 + cpu.registers.get8("C").read()
    const memoryLocation = cpu.memory.at(address)
    memoryLocation.write(cpu.registers.get8("A").read())
  },
  cycles: 8,
  parameterBytes: 0,
  description: () => "LD (0xFF00+C),A"
}

export const loadFromMemoryAtC: Instruction = {
  execute: (cpu) => {
    const address = 0xFF00 + cpu.registers.get8("C").read()
    const memoryLocation = cpu.memory.at(address)
    cpu.registers.get8("A").write(memoryLocation.read())
  },
  cycles: 8,
  parameterBytes: 0,
  description: () => "LD A,(0xFF00+C)"
}

export const loadToMemoryAtImmediate: Instruction = {
  execute: (cpu) => {
    const address = 0xFF00 + cpu.readNextByte()
    const memoryLocation = cpu.memory.at(address)
    memoryLocation.write(cpu.registers.get8("A").read())
  },
  cycles: 12,
  parameterBytes: 1,
  description: ([value]) => `LD (0xFF00+${valueDisplay(value)}),A`
}

export const loadFromMemoryAtImmediate: Instruction = {
  execute: (cpu) => {
    const address = 0xFF00 + cpu.readNextByte()
    const memoryLocation = cpu.memory.at(address)
    cpu.registers.get8("A").write(memoryLocation.read())
  },
  cycles: 12,
  parameterBytes: 1,
  description: ([value]) => `LD A,(0xFF00+${valueDisplay(value)})`
}

export function loadFrom16BitRegisterLocation(register: Register16Name): Instruction {
  return {
    execute: (cpu) => {
      const address = cpu.registers.get16(register).read()
      const memoryLocation = cpu.memory.at(address)
      cpu.registers.get8("A").write(memoryLocation.read())
    },
    cycles: 8,
    parameterBytes: 0,
    description: () => `LD A,(${register})`
  }
}

export function loadTo16BitRegisterLocation(register: Register16Name): Instruction {
  return {
    execute: (cpu) => {
      const address = cpu.registers.get16(register).read()
      const memoryLocation = cpu.memory.at(address)
      memoryLocation.write(cpu.registers.get8("A").read())
    },
    cycles: 8,
    parameterBytes: 0,
    description: () => `LD (${register}),A`
  }
}