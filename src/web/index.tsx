import { createRoot } from "react-dom/client"
import React from "react"
import App from "./components/app"
import "./index.css"
import Memory from "../emulator/memory"
import CpuRegisters from "../emulator/register"
import CPU from "../emulator/cpu"

const memory = new Memory()
const registers = new CpuRegisters()
const cpu = new CPU(memory, registers)

var mountNode = document.getElementById("app")
const root = createRoot(mountNode!)
root.render(<App cpu={cpu} />)