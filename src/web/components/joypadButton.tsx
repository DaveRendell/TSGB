import * as React from "react"
import "../joypadButton.css"
import Controller, { Button } from "../../emulator/controller"

type Direction = "L" | "R" | "U" | "D"
interface Props {
  name: Button
  type: string
  symbol?: string
  dpadDirection?: Direction
  controller: Controller
  isActive: boolean
}

function getSVGPoints(direction: Direction): string {
  switch(direction) {
    case "L": return "1,10 18,20 18,0"
    case "R": return "18,10 1,20 1,0"
    case "U": return "10,1 20,18 0,18"
    case "D": return "10,18 20,1 0,1"
  }
}

export default function JoypadButton({
  name,
  type,
  symbol,
  dpadDirection,
  controller,
  isActive,
}: Props) {
  const button = React.useRef<HTMLButtonElement>(null)
  const request = React.useRef<number>()
  const updateCss = () => {
    if (button.current) {
      if (controller.isPressed[name]) {
        button.current.classList.add("active")
      } else {
        button.current.classList.remove("active")
      }
    }
    request.current = requestAnimationFrame(updateCss)
  }
  React.useEffect(() => {
    updateCss()
    return () => cancelAnimationFrame(request.current)
  }, [controller])

  const press = () => {
    controller.handleHtmlButtonPress(name)
  }
  const release = () => {
    controller.handleHtmlButtonRelease(name)
  }
  return (
    <div className="button-container" id={`container-${name}`}>
      <button
        className={`joypad-button ${type} ${isActive ? "active" : ""}`}
        onMouseDown={() => press()}
        onMouseUp={() => release()}
        onTouchStart={(e) => {
            e.preventDefault()
            press()
          }
        }
        onTouchEnd={() =>
          release()
        }
        onMouseLeave={(e) => {
          if (e.buttons & 0b1) { release() }
        }}
        onMouseEnter={(e) => {
          if (e.buttons & 0b1) { press() }
        }}
        ref={button}
      >
      { symbol
        ? symbol
        : dpadDirection
        ? <svg height="20" width="20"><polygon points={getSVGPoints(dpadDirection)} style={{"fill": "grey"}} /></svg>
        : <></> }
      </button>
    </div>
  )
}
