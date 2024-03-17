import * as React from "react"
import "../joypadButton.css"
import Controller, { Button } from "../../emulator/controller"

interface Props {
  name: Button
  type: string
  symbol: string
  controller: Controller
  isActive: boolean
}

export default function JoypadButton({
  name,
  type,
  symbol,
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
        {symbol}
      </button>
    </div>
  )
}
