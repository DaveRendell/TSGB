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

  return (
    <section className="joypad">
      <JoypadButton
        name="Up"
        dpadDirection="U"
        type="dpad-button"
        controller={controller}
        isActive={buttons["Up"]}
      />
      <JoypadButton
        name="Left"
        dpadDirection="L"
        type="dpad-button"
        controller={controller}
        isActive={buttons["Left"]}
      />
      <JoypadButton
        name="Right"
        dpadDirection="R"
        type="dpad-button"
        controller={controller}
        isActive={buttons["Right"]}
      />
      <JoypadButton
        name="Down"
        dpadDirection="D"
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
