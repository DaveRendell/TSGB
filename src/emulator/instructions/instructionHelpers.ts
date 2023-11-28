import { Target8Name, MutableValue, Register16Name, ByteSourceName, ReadableValue, ByteDestinationName } from "../../types";
import CPU from "../cpu";

export const getByteDestination = (name: ByteDestinationName, cpu: CPU): MutableValue<8> => {
  if (name === "M") {
    return cpu.memory.at(cpu.registers.get16("HL").read())
  }

  if (name === "(BC)") {
    return cpu.memory.at(cpu.registers.get16("BC").read())
  }

  if (name === "(DE)") {
    return cpu.memory.at(cpu.registers.get16("DE").read())
  }

  if (name === "(FF,C)") {
    return cpu.memory.at(cpu.registers.get8("C").read() + 0xFF00)
  }

  if (name === "(FF,N)") {
    return cpu.memory.at(cpu.nextByte.read() + 0xFF00)
  }

  if (name === "(NN)") {
    const l = cpu.nextByte.read()
    const h = cpu.nextByte.read()
    return cpu.memory.at(combineBytes(h, l))
  }

  return cpu.registers.get8(name)
}

export const getByteSource = (name: ByteSourceName, cpu: CPU): ReadableValue<8> =>
  name === "N" ? cpu.nextByte : getByteDestination(name, cpu)

export const get16BitRegister = (name: Register16Name, cpu: CPU): MutableValue<16> =>
  cpu.registers.get16(name)

export const to2sComplement = (input: number) =>
  input < 0x00 ? input + 0x100 : input

export const from2sComplement = (input: number) =>
  input > 0x7F ? input - 0x100 : input

export const combineBytes = (high: number, low: number) =>
  (high << 8) + low

export const splitBytes = (input: number) =>
  [(input & 0xFF00) >> 8, input & 0x00FF]