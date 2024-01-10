import * as React from "react"
import Controller, { Button } from "../../emulator/controller"
import JoypadButton from "./joypadButton"

interface Props {
  controller: Controller
}

export default function Joypad({ controller }: Props) {
  const [buttons, setButtons] = React.useState<Record<Button, boolean>>({
    A: false,
    B: false,
    Start: false,
    Select: false,
    Up: false,
    Down: false,
    Left: false,
    Right: false,
  })
  controller.updateUi = (isPressed) => {
    setButtons(isPressed)
  }

  return (
    <section className="joypad">
      <JoypadButton
        name="Up"
        symbol="▲"
        type="dpad-button"
        controller={controller}
        isActive={buttons["Up"]}
      />
      <JoypadButton
        name="Left"
        symbol="◄"
        type="dpad-button"
        controller={controller}
        isActive={buttons["Left"]}
      />
      <JoypadButton
        name="Right"
        symbol="►"
        type="dpad-button"
        controller={controller}
        isActive={buttons["Right"]}
      />
      <JoypadButton
        name="Down"
        symbol="▼"
        type="dpad-button"
        controller={controller}
        isActive={buttons["Down"]}
      />

      <JoypadButton
        name="B"
        symbol="B"
        type="face-button"
        controller={controller}
        isActive={buttons["B"]}
      />
      <JoypadButton
        name="A"
        symbol="A"
        type="face-button"
        controller={controller}
        isActive={buttons["A"]}
      />

      <div className="menu-buttons">
        <JoypadButton
          name="Select"
          symbol="SELECT"
          type="menu-button"
          controller={controller}
          isActive={buttons["Select"]}
        />
        <JoypadButton
          name="Start"
          symbol="START"
          type="menu-button"
          controller={controller}
          isActive={buttons["Start"]}
        />
      </div>
    </section>
  )
}
