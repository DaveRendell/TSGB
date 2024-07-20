import * as React from "react"
import Controller, { Button } from "../../emulator/controller"
import JoypadButton from "./joypadButton"

interface Props {
  controller: Controller
}

interface Point { x: number, y: number }

const LEFT_THUMB_BUTTONS: Button[] = [
  "Up",
  "Left",
  "Right",
  "Down",
]

const RIGHT_THUMB_BUTTONS: Button[] = [
  "B",
  "A",
  "Select",
  "Start",
]

export default function Joypad({ controller }: Props) {
  const upButton = React.useRef<HTMLButtonElement>(null)
  const leftButton = React.useRef<HTMLButtonElement>(null)
  const rightButton = React.useRef<HTMLButtonElement>(null)
  const downButton = React.useRef<HTMLButtonElement>(null)

  const bButton = React.useRef<HTMLButtonElement>(null)
  const aButton = React.useRef<HTMLButtonElement>(null)

  const selectButton = React.useRef<HTMLButtonElement>(null)
  const startButton = React.useRef<HTMLButtonElement>(null)

  const buttonRefs: Record<Button, React.MutableRefObject<HTMLButtonElement>> = {
    "Up": upButton,
    "Left": leftButton,
    "Right": rightButton,
    "Down": downButton,
    "B": bButton,
    "A": aButton,
    "Select": selectButton,
    "Start": startButton
  }

  const handleTouchMove = (buttons: Button[]) => (x: number, y: number) => {
    const touchedElement = document.elementFromPoint(x, y)
    buttons.forEach(button => {
      if (touchedElement === buttonRefs[button].current) {
        controller.pressButton(button)
      } else {
        controller.releaseButton(button)
      }
    })
  }

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
        buttonRef={upButton}
        isActive={buttons["Up"]}
        handleTouchMove={handleTouchMove(LEFT_THUMB_BUTTONS)}
      />
      <JoypadButton
        name="Left"
        dpadDirection="L"
        type="dpad-button"
        controller={controller}
        buttonRef={leftButton}
        isActive={buttons["Left"]}
        handleTouchMove={handleTouchMove(LEFT_THUMB_BUTTONS)}
      />
      <JoypadButton
        name="Right"
        dpadDirection="R"
        type="dpad-button"
        controller={controller}
        buttonRef={rightButton}
        isActive={buttons["Right"]}
        handleTouchMove={handleTouchMove(LEFT_THUMB_BUTTONS)}
      />
      <JoypadButton
        name="Down"
        dpadDirection="D"
        type="dpad-button"
        controller={controller}
        buttonRef={downButton}
        isActive={buttons["Down"]}
        handleTouchMove={handleTouchMove(LEFT_THUMB_BUTTONS)}
      />

      <JoypadButton
        name="B"
        symbol="B"
        type="face-button"
        controller={controller}
        buttonRef={bButton}
        isActive={buttons["B"]}
        handleTouchMove={handleTouchMove(RIGHT_THUMB_BUTTONS)}
      />
      <JoypadButton
        name="A"
        symbol="A"
        type="face-button"
        controller={controller}
        buttonRef={aButton}
        isActive={buttons["A"]}
        handleTouchMove={handleTouchMove(RIGHT_THUMB_BUTTONS)}
      />

      <div className="menu-buttons">
        <JoypadButton
          name="Select"
          symbol="SELECT"
          type="menu-button"
          controller={controller}
          buttonRef={selectButton}
          isActive={buttons["Select"]}
          handleTouchMove={handleTouchMove(RIGHT_THUMB_BUTTONS)}
        />
        <JoypadButton
          name="Start"
          symbol="START"
          type="menu-button"
          controller={controller}
          buttonRef={startButton}
          isActive={buttons["Start"]}
          handleTouchMove={handleTouchMove(RIGHT_THUMB_BUTTONS)}
        />
      </div>
    </section>
  )
}
