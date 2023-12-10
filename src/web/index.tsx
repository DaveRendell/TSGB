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

const memory = new Memory()
const controller = new Controller(memory)
controller.initialiseEvents()

const cpu = new CPU(memory)
const ppu = new PPU(cpu)
const apu = new APU(cpu)

var mountNode = document.getElementById("app")
const root = createRoot(mountNode!)
root.render(<App cpu={cpu} ppu={ppu} apu={apu} controller={controller}/>)