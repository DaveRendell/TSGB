import { createRoot } from "react-dom/client"
import React from "react"
import App from "./components/app"
import "./index.css"
import Memory from "../emulator/memory"
import CpuRegisters from "../emulator/register"
import CPU from "../emulator/cpu"
import { to2sComplement } from "../emulator/instructions/instructionHelpers"
import PPU from "../emulator/ppu"
import APU from "../emulator/apu"
import Controller from "../emulator/controller"


const controller = new Controller()
controller.initialiseEvents()
const memory = new Memory(
  controller, [
  0x76 // HALT
])

// const memory = new Memory([
//   0b00100110, 0x0D, // Set H to 0x0D

//   0b00000110, 0x02, // Set B to 2

//   // Loop until B > 0x0F
//     0b01101000, // Set L to B
//     0b01111110, // Set A = (HL)
//     0b11111110, 0, // Check if A == 0
//     0b00100000, to2sComplement(9), // If (HL) != 0, skip next block
//       // Add B to L, L = 2*B
//       0b01111101, // Set A to L
//       0b10000000, // Add B to A
//       0b01101111, // Set L to A

//       0b00111000, to2sComplement(4), // If L > 0xFF, skip to `INC B`
//       0b00110110, 1, // Set (HL) to 1
//       0b00110000, to2sComplement(-9), // Jump back until Add operation overflows

//   0b00000100, // INC B
//   0b00111110, 0xF, // LD A,0xF
//   0b10111000, // CP A,0
//   0b00100000, to2sComplement(-21), // if B is not 0xF, return to start of B loop

//   // Sieve complete, output to memory starting 0x0F00
//   // B will point to progress through sieve
//   // C will point to progress through output

//   0b00000110, 2, // LD B,2 (skip 0 and 1)

//   // Loop until B overflows
//     0b00100110, 0x0D, // Set H to 0x0D
//     0b01101000, // Set L to B
//     0b01111110, // Set A = M
//     0b11111110, 1, // Compare A to 1
//     0b101000, to2sComplement(5), // If A == 1, skip to INC B
//       0b00100110, 0x0F, // Set H to 0x0F
//       0b01101001, // Set L to C
//       0b01110000, // Write B to M
//       0b00001100, // INC C
//     0b00000100, // INC B
//   0b00100000, to2sComplement(-16), // Jump to start of loop

//   0x76 // HALT
// ])

const registers = new CpuRegisters()
const cpu = new CPU(memory, registers)
const ppu = new PPU(cpu)
const apu = new APU(cpu)

var mountNode = document.getElementById("app")
const root = createRoot(mountNode!)
root.render(<App cpu={cpu} ppu={ppu} apu={apu} controller={controller}/>)