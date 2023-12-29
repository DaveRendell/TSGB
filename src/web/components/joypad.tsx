import * as React from "react"
import Controller, { Button } from "../../emulator/controller"
import JoypadButton from "./joypadButton"

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
    <section className="joypad">
      <JoypadButton name="Up" symbol="▲" type="dpad-button" controller={controller} />
      <JoypadButton name="Left" symbol="◄" type="dpad-button" controller={controller} />
      <JoypadButton name="Right" symbol="►" type="dpad-button" controller={controller} />
      <JoypadButton name="Down" symbol="▼" type="dpad-button" controller={controller} />

      <JoypadButton name="B" symbol="B" type="face-button" controller={controller} />
      <JoypadButton name="A" symbol="A" type="face-button" controller={controller} />

      <div className="menu-buttons">
        <JoypadButton name="Select" symbol="SELECT" type="menu-button" controller={controller} />
        <JoypadButton name="Start" symbol="START" type="menu-button" controller={controller} />
      </div>
    </section>
  )
}