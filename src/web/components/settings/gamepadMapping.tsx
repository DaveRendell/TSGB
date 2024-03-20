import * as React from "react"
import { Emulator } from "../../../emulator/emulator"
import { BUTTONS, Button } from "../../../emulator/controller"

interface Props {
  emulator: Emulator
}

export default function GamepadMapping({ emulator }: Props) {
  const [listeningButton, setListeningButton] = React.useState<Button | undefined>(undefined)
  const [gamepadBindings, setGamepadBindings] = React.useState({...emulator.controller.gamepadBindings})

  return (
    <div>
      <h3>Gamepad controls</h3>
      <dl>
        {BUTTONS.map(button => {
          const keys = gamepadBindings[button]
          return <div key={button}>
            <dt>{button}</dt>
            <dd>
              {keys.map(key => <span>Button {key} <button className="chunky-button" onClick={() => {}}>Remove</button></span>)}
              {
                listeningButton === button
                  ? <>
                    Press key for button {button}...
                    <button className="chunky-button action-button" onClick={() => setListeningButton(undefined)}>Cancel</button>
                  </>
                  : <button className="chunky-button action-button" onClick={() => setListeningButton(button)}>Add</button>
              }              
            </dd>
          </div>
        })}
      </dl>
    </div>
  )
}