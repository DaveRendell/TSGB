import { addressDisplay, valueDisplay } from "../../helpers/displayHexNumbers";
import { ByteDestinationName, ByteSourceName, Register16Name, Register8Name, Target8Name } from "../../types";
import { decrement, increment } from "../arithmetic";
import { Instruction } from "../instruction";
import { combineBytes, get16BitRegister, getByteSource, getByteDestination } from "./instructionHelpers";

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