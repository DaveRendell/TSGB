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

export default function JoypadButton({ name, type, symbol, controller, isActive }: Props) {
  const press = () => { controller.handleHtmlButtonPress(name) }
  const release = () => { controller.handleHtmlButtonRelease(name) }
  return (<div className="button-container" id={`container-${name}`}>
    <button
      className={`joypad-button ${type} ${isActive ? "active" : ""}`}
      onMouseDown={() => press()}
      onMouseUp={() => release()}
      onTouchStart={() => press()}
      onTouchEnd={() => release()}
    >{symbol}</button>
  </div>)
}