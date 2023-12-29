import * as React from "react"
import "../joypadButton.css"

interface Props {
  name: string
  type: string
  symbol: string
}

export default function JoypadButton({ name, type, symbol }: Props) {
  return (<div className="button-container" id={`container-${name}`}>
    <button className={`joypad-button ${type}`}>{symbol}</button>
  </div>)
}