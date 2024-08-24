import {
  addressDisplay,
  valueDisplay,
} from "../../../helpers/displayHexNumbers"
import CPU from "../cpu"
import { ByteRef, ConstantByteRef } from "../../refs/byteRef"
import { CompositeWordRef, WordRef } from "../../refs/wordRef"
import { Emulator } from "../../emulator"
import findSymbol from "../../debug/findSymbol"

export enum ByteLocation {
  A,
  F,
  B,
  C,
  D,
  E,
  H,
  L,
  N,
  M,
  FF_N,
  FF_C,
  BC,
  DE,
  NN,
}

export const getByteRef = (name: ByteLocation, cpu: CPU): ByteRef => {
  switch (name) {
    case ByteLocation.A:
      return cpu.registers.A
    case ByteLocation.F:
      return cpu.registers.F
    case ByteLocation.B:
      return cpu.registers.B
    case ByteLocation.C:
      return cpu.registers.C
    case ByteLocation.D:
      return cpu.registers.D
    case ByteLocation.E:
      return cpu.registers.E
    case ByteLocation.H:
      return cpu.registers.H
    case ByteLocation.L:
      return cpu.registers.L
    case ByteLocation.N:
      return cpu.nextByte
    case ByteLocation.M:
      return cpu.memory.atPointer(cpu.registers.HL)
    case ByteLocation.BC:
      return cpu.memory.atPointer(cpu.registers.BC)
    case ByteLocation.DE:
      return cpu.memory.atPointer(cpu.registers.DE)
    case ByteLocation.FF_C:
      return cpu.memory.atLastPagePointer(cpu.registers.C)
    case ByteLocation.FF_N:
      return cpu.memory.atLastPagePointer(cpu.nextByte)
    case ByteLocation.NN:
      return cpu.memory.atPointer(cpu.nextWord)
  }
}

export const describeByteLocation = (
  location: ByteLocation,
  emulator: Emulator,
): ((values: number[]) => string) => {
  switch (location) {
    case ByteLocation.A:
      return () => "a"
    case ByteLocation.F:
      return () => "f"
    case ByteLocation.B:
      return () => "b"
    case ByteLocation.C:
      return () => "c"
    case ByteLocation.D:
      return () => "d"
    case ByteLocation.E:
      return () => "e"
    case ByteLocation.H:
      return () => "h"
    case ByteLocation.L:
      return () => "l"
    case ByteLocation.N:
      return ([value]) => valueDisplay(value)
    case ByteLocation.M:
      return () => "[hl]"
    case ByteLocation.FF_N:
      return ([value]) => `[${describePointer(0xff00 + value, emulator)}]`
    case ByteLocation.FF_C:
      return () => `[$00ff + c]`
    case ByteLocation.BC:
      return () => "[bc]"
    case ByteLocation.DE:
      return () => "[de]"
    case ByteLocation.NN:
      return ([l, h]) => `[${describePointer((h << 8) + l, emulator)}]`
  }
}

export enum WordLocation {
  PC,
  SP,
  HL,
  AF,
  BC,
  DE,
}

export const getWordRef = (name: WordLocation, cpu: CPU): WordRef => {
  switch (name) {
    case WordLocation.PC:
      return cpu.registers.PC
    case WordLocation.SP:
      return cpu.registers.SP
    case WordLocation.HL:
      return cpu.registers.HL
    case WordLocation.AF:
      return cpu.registers.AF
    case WordLocation.BC:
      return cpu.registers.BC
    case WordLocation.DE:
      return cpu.registers.DE
  }
}

export const describeWordLocation = (
  name: WordLocation,
): ((values: number[]) => string) => {
  switch (name) {
    case WordLocation.PC:
      return () => "PC"
    case WordLocation.SP:
      return () => "SP"
    case WordLocation.HL:
      return () => "HL"
    case WordLocation.AF:
      return () => "AF"
    case WordLocation.BC:
      return () => "BC"
    case WordLocation.DE:
      return () => "DE"
  }
}

export const to2sComplement = (input: number) =>
  input < 0x00 ? input + 0x100 : input

export const from2sComplement = (input: number) =>
  input > 0x7f ? input - 0x100 : input

export const combineBytes = (high: number, low: number) => (high << 8) + low

export const splitBytes = (input: number) => [
  (input & 0xff00) >> 8,
  input & 0x00ff,
]

export const describePointer = (address: number, emulator: Emulator): string => {
  const symbol = findSymbol(emulator.debugMap, address, emulator.memory)
  if (symbol && symbol.address === address) { return symbol.name }
  return valueDisplay(address)
}

export const describePointerFromBytes = (bytes: number[], emulator: Emulator): string => {
  const address = combineBytes(bytes[2], bytes[1])
  return describePointer(address, emulator)
}