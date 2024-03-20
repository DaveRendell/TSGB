import * as React from "react"
import { Emulator } from "../../../emulator/emulator"
import { BUTTONS } from "../../../emulator/controller"

interface Props {
  emulator: Emulator
}

export default function KeyboardMapping({ emulator }: Props) {
  return (
    <div>
      <h3>Keyboard controls</h3>
      <dl>
        {BUTTONS.map(button => {
          const keys = emulator.controller.keyboardBindings[button]
          return <div key="button">
            <dt>{button}</dt>
            <dd>
              {keys.map(key => <span>{key} <button className="chunky-button">Remove</button></span>)}
              <button className="chunky-button action-button">Add</button>
            </dd>
          </div>
        })}
      </dl>
    </div>
  )
}