import { valueDisplay } from "../../helpers/displayHexNumbers";
import { Register8Name, Target8Name } from "../../types";
import { Instruction } from "../instruction";
import { getValue } from "./instructionHelpers";

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