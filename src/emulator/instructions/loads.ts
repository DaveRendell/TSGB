import { addressDisplay, valueDisplay } from "../../helpers/displayHexNumbers";
import { ByteDestinationName, ByteSourceName, Register16Name, Register8Name, Target8Name } from "../../types";
import { decrement, increment } from "../arithmetic";
import { Instruction } from "../instruction";
import { combineBytes, get16BitRegister, getByteSource, getByteDestination, splitBytes, from2sComplement } from "./instructionHelpers";

const cycleCost = (location: ByteSourceName): number => {
  if (location === "M") { return 4 }
  if (location === "N") { return 4 }
  if (location === "(BC)") { return 4 }
  if (location === "(DE)") { return 4 }
  if (location === "(FF,C)") { return 4 }
  if (location === "(FF,N)") { return 8 }
  if (location === "(NN)") { return 12 }
  return 0
}

const getParameterBytes = (location: ByteSourceName): number => {
  if (location === "N") { return 1 }
  if (location === "(FF,N)") { return 1 }
  if (location === "(NN)") { return 2 }
  return 0
}

const describeLocation = (location: ByteSourceName): (values: number[]) => string => {
  if (location === "N") { return ([value]) => valueDisplay(value) }
  if (location === "(FF,N)") { return ([value]) => addressDisplay(0xFF00 + value) }
  if (location === "(NN)") { return ([l, h]) => addressDisplay(combineBytes(h, l))}
  return () => location
}

const commandName = (hlRegisterAction: "none" | "increment" | "decrement") =>
  hlRegisterAction === "increment"
    ? "LDI"
    : hlRegisterAction === "decrement" ? "LDD" : "LD"

const getPointerAction = (hlRegisterAction: "none" | "increment" | "decrement") =>
  hlRegisterAction === "increment"
    ? increment
    : hlRegisterAction === "decrement" ? decrement : () => {}

export function load8Bit(
  destinationName: ByteDestinationName,
  sourceName: ByteSourceName,
  hlRegisterAction: "none" | "increment" | "decrement" = "none"
): Instruction {
  const cycles = 4 + cycleCost(destinationName) + cycleCost(sourceName)

  const parameterBytes = getParameterBytes(sourceName) + getParameterBytes(destinationName)

  const pointerAction = getPointerAction(hlRegisterAction)


  return {
    execute: (cpu) => {
      const destination = getByteDestination(destinationName, cpu)
      const source = getByteSource(sourceName, cpu)

      destination.write(source.read())

      pointerAction(cpu.registers.get16("HL"))
    },
    cycles,
    parameterBytes,
    description: (values) =>
      `${commandName(hlRegisterAction)} ${describeLocation(destinationName)(values)},${describeLocation(sourceName)(values)}`
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

export const loadHlFromSpPlusN: Instruction = {
  execute(cpu) {
    const increment = from2sComplement(cpu.nextByte.read())
    const sp = cpu.registers.get16("SP").read()
    const result = sp + increment

    const halfCarry = (sp & 0xF) + (increment & 0xF) !== (result & 0xF)
    const carry = (sp & 0xFF) + (increment & 0xFF) !== (result & 0xFF)

    cpu.registers.get16("HL").write(result & 0xFFFF)
    cpu.registers.getFlag("Zero").write(0)
    cpu.registers.getFlag("Operation").write(0)
    cpu.registers.getFlag("Half-Carry").write(halfCarry ? 1 : 0)
    cpu.registers.getFlag("Carry").write(carry ? 1 : 0)
  },
  cycles: 12,
  parameterBytes: 1,
  description: ([value]) => `LD HL,SP+${valueDisplay(value)}`
}

export const loadStackPointerToAddress: Instruction = {
  execute(cpu) {
    const [hSP, lSP] = splitBytes(cpu.registers.get16("SP").read())
    const address = cpu.readNext16bit()

    cpu.memory.at(address).write(lSP)
    cpu.memory.at(address + 1).write(hSP)
  },
  cycles: 20,
  parameterBytes: 2,
  description: ([l, h]) => `LD (${addressDisplay(combineBytes(h, l))}),SP`
}

export const loadStackPointerFromHL: Instruction = {
  execute(cpu) {
    const sp = cpu.registers.get16("SP")
    const hl = cpu.registers.get16("HL")

    sp.write(hl.read())
  },
  cycles: 8,
  parameterBytes: 0,
  description: () => "LD SP,HL"
}