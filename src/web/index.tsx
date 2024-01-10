import { createRoot } from "react-dom/client"
import React from "react"
import GameView from "./components/gameView"
import "./index.css"
import { Cartridge } from "../emulator/memory/cartridges/cartridge"
import { Emulator } from "../emulator/emulator"
import App from "./components/app"

var mountNode = document.getElementById("app")
const root = createRoot(mountNode!)
root.render(<App />)
