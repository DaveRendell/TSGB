import * as React from "react"
import Controller, { Button } from "../../emulator/controller"

interface Props {
  controller: Controller
}

export default function Joypad({controller}: Props) {
  
  const [buttons, setButtons] = React.useState<Record<Button, boolean>>({
    "A": false,
    "B": false,
    "Start": false,
    "Select": false,
    "Up": false,
    "Down": false,
    "Left": false,
    "Right": false,
  })
  controller.updateUi = (isPressed) => {
    setButtons(isPressed)
  }

  return (
    <section>
      A: {buttons["A"] ? "On" : "Off"}{" "}
      B: {buttons["B"] ? "On" : "Off"}{" "}
      Start: {buttons["Start"] ? "On" : "Off"}{" "}
      Select: {buttons["Select"] ? "On" : "Off"}{" "}
      Up: {buttons["Up"] ? "On" : "Off"}{" "}
      Down: {buttons["Down"] ? "On" : "Off"}{" "}
      Left: {buttons["Left"] ? "On" : "Off"}{" "}
      Right: {buttons["Right"] ? "On" : "Off"}{" "}
    </section>
  )
}