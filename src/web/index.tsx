import { createRoot } from "react-dom/client"
import React from "react"
import App from "./components/app"
import "./index.css"

var mountNode = document.getElementById("app")
const root = createRoot(mountNode!)
root.render(<App />)