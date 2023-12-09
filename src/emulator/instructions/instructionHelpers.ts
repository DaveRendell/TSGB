import { addressDisplay, valueDisplay } from "../../helpers/displayHexNumbers";
import { MutableValue, Register16Name } from "../../types";
import CPU from "../cpu";
import { ByteRef } from "../refs/byteRef";
import { WordRef } from "../refs/wordRef";

export enum ByteLocation {
  A, F, B, C, D, E, H, L, N, M, FF_N, FF_C, BC, DE, NN
}

export const getByteRef = (name: ByteLocation, cpu: CPU): ByteRef => {
  switch(name) {
    case ByteLocation.A: return cpu.registers.A 
    case ByteLocation.F: return cpu.registers.F 
    case ByteLocation.B: return cpu.registers.B 
    case ByteLocation.C: return cpu.registers.C 
    case ByteLocation.D: return cpu.registers.D 
    case ByteLocation.E: return cpu.registers.E 
    case ByteLocation.H: return cpu.registers.H 
    case ByteLocation.L: return cpu.registers.L 
    case ByteLocation.N: return cpu.nextByte
    case ByteLocation.M: return cpu.memory.at(cpu.registers.HL.value) 
    case ByteLocation.BC: return cpu.memory.at(cpu.registers.BC.value)
    case ByteLocation.DE: return cpu.memory.at(cpu.registers.DE.value)
    case ByteLocation.FF_C: return cpu.memory.at(0xFF00 + cpu.registers.C.value)
    case ByteLocation.FF_N: return cpu.memory.at(0xFF00 + cpu.nextByte.value)
    case ByteLocation.NN: return cpu.memory.at(cpu.nextWord.value)
  }
}

export const describeByteLocation = (location: ByteLocation): (values: number[]) => string => {
  switch(location) {
    case ByteLocation.A: return () => "A"
    case ByteLocation.F: return () => "F"
    case ByteLocation.B: return () => "B"
    case ByteLocation.C: return () => "C"
    case ByteLocation.D: return () => "D"
    case ByteLocation.E: return () => "E"
    case ByteLocation.H: return () => "H"
    case ByteLocation.L: return () => "L"
    case ByteLocation.N: return ([value]) => valueDisplay(value)
    case ByteLocation.M: return () => "M"
    case ByteLocation.FF_N: return ([value]) => `(${addressDisplay(0xFF00 + value)})`
    case ByteLocation.FF_C: return () => "(FF,C)"
    case ByteLocation.BC: return () => "(BC)"
    case ByteLocation.DE: return () => "(DE)"
    case ByteLocation.NN: return ([l, h]) => `(${addressDisplay((h << 8) + l)})`
  }
}

export enum WordLocation {
  PC, SP, HL, AF, BC, DE
}

export const getWordRef = (name: WordLocation, cpu: CPU): WordRef => {
  switch(name) {
    case WordLocation.PC: return cpu.registers.PC
    case WordLocation.SP: return cpu.registers.SP
    case WordLocation.HL: return cpu.registers.HL
    case WordLocation.AF: return cpu.registers.AF
    case WordLocation.BC: return cpu.registers.BC
    case WordLocation.DE: return cpu.registers.DE
  }
}

export const describeWordLocation = (name: WordLocation): (values: number[]) => string => {
  switch(name) {
    case WordLocation.PC: return () => "PC"
    case WordLocation.SP: return () => "SP"
    case WordLocation.HL: return () => "HL"
    case WordLocation.AF: return () => "AF"
    case WordLocation.BC: return () => "BC"
    case WordLocation.DE: return () => "DE"
  }
}

export const to2sComplement = (input: number) =>
  input < 0x00 ? input + 0x100 : input

export const from2sComplement = (input: number) =>
  input > 0x7F ? input - 0x100 : input

export const combineBytes = (high: number, low: number) =>
  (high << 8) + low

export const splitBytes = (input: number) =>
  [(input & 0xFF00) >> 8, input & 0x00FF]

export const testBit = <IntSize extends number>(value: MutableValue<IntSize>, bit: number): number =>
  (value.read() >> bit) & 1

export const setBit = <IntSize extends number>(value: MutableValue<IntSize>, bit: number) =>
  value.write(value.read() | (1 << bit))

export const resetBit = <IntSize extends number>(value: MutableValue<IntSize>, bit: number) =>
  value.write(value.read() & ~(1 << bit))