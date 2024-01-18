import { createRoot } from "react-dom/client"
import React from "react"
import "./index.css"
import App from "./components/app"

var mountNode = document.getElementById("app")
const root = createRoot(mountNode!)
root.render(<App />)