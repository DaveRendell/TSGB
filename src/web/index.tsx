import { createRoot } from "react-dom/client"
import React from "react"
import App from "./components/app"
import "./index.css"
import Memory from "../emulator/memory"

const memory = new Memory()

var mountNode = document.getElementById("app")
const root = createRoot(mountNode!)
root.render(<App memory = {memory} />)