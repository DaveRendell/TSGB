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
import { Cartridge } from "../emulator/memory/cartridges/cartridge"
import { Emulator } from "../emulator/emulator"

const emulator = new Emulator(new Cartridge(new Uint8Array()))
var mountNode = document.getElementById("app")
const root = createRoot(mountNode!)
root.render(<App emulator={emulator} />)