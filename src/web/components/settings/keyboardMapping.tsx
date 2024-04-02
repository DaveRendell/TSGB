import * as React from "react"
import { Emulator } from "../../../emulator/emulator"
import { BUTTONS, Button } from "../../../emulator/controller"

interface Props {
  emulator: Emulator
}

export default function KeyboardMapping({ emulator }: Props) {
  const [listeningButton, _setListeningButton] = React.useState<Button | undefined>(undefined)
  const [keyboardBindings, setKeyboardBindings] = React.useState({...emulator.controller.keyboardBindings})
  const listeningButtonRef = React.useRef<Button | undefined>(undefined)
  const setListeningButton = (button: Button | undefined) => {
    listeningButtonRef.current = button
    _setListeningButton(button)
  }

  React.useEffect(() => {
    console.log("Setting up keyboard mapping input events")
    document.addEventListener("keydown", (e) => {
      console.log(e.code)
      const button = listeningButtonRef.current
      if (button) {
        console.log(`Mapping key ${e.code} to button ${button}`)
        // Update emulator.controller
        const keys = emulator.controller.keyboardBindings[button]
        if (!keys.includes(e.code)) {
          keys.push(e.code)
          emulator.controller.setKeyMap()
          setKeyboardBindings({...emulator.controller.keyboardBindings})
        }
        
        // Persist to localstorage
        window.localStorage.setItem("keyboardBindings", JSON.stringify(emulator.controller.keyboardBindings))
        
        // Stop listening
        setListeningButton(undefined)
      } else {
        console.log("Nope", button)
      }
    })
  }, [])

  const removeKey = (button: Button, key: string) => {
    emulator.controller.keyboardBindings[button] =
      emulator.controller.keyboardBindings[button].filter(k => k !== key)
    emulator.controller.setKeyMap()
    setKeyboardBindings({...emulator.controller.keyboardBindings})
  }

  return (
    <div>
      <h3>Keyboard controls</h3>
      <dl>
        {BUTTONS.map(button => {
          const keys = keyboardBindings[button]
          return <div key={button}>
            <dt>{button}</dt>
            <dd>
              {keys.map(key => <span>{key} <button className="chunky-button" onClick={() => removeKey(button, key)}>Remove</button></span>)}
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