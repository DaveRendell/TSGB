import * as React from "react"
import { Emulator } from "../../../emulator/emulator"
import { BUTTONS, Button } from "../../../emulator/controller"

interface Props {
  emulator: Emulator
}

export default function GamepadMapping({ emulator }: Props) {
  const [listeningButton, _setListeningButton] = React.useState<Button | undefined>(undefined)
  const [gamepadBindings, setGamepadBindings] = React.useState({...emulator.controller.gamepadBindings})
  const bindingsRef = React.useRef(emulator.controller.gamepadBindings)
  const listeningButtonRef = React.useRef<Button | undefined>(undefined)
  const setListeningButton = (button: Button | undefined) => {
    listeningButtonRef.current = button
    _setListeningButton(button)
  }

  const intervalRef = React.useRef<NodeJS.Timeout>()

  React.useEffect(() => {
    intervalRef.current = setInterval(() => {
      const button = listeningButtonRef.current
      if (button && emulator.controller.gamepad) {
        const pressedButton = emulator.controller.gamepad.buttons
          .map((padButton, i) => ({padButton, i}))
          .find(({padButton}) => padButton.pressed)
        if (pressedButton) {
          // Update emulator.controller
          const padButtons = emulator.controller.gamepadBindings[button]
          if (!padButtons.includes(pressedButton.i)) {
            padButtons.push(pressedButton.i)
            setGamepadBindings({...emulator.controller.gamepadBindings})
          }

          // persist to local storage
          window.localStorage.setItem("gamepadBindings", JSON.stringify(emulator.controller.gamepadBindings))

          // Stop listening
          setListeningButton(undefined)
        }
      }
    }, 50)

    return () => clearInterval(intervalRef.current)
  }, [])

  return (
    <div>
      <h3>Gamepad controls</h3>
      {
        emulator.controller.gamepad
          ? <span>Connected controller: {emulator.controller.gamepad.id}</span>
          : <></>
      }
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