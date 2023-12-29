import Memory from "./memory"
import { Interrupt, InterruptRegister } from "./memory/registers/interruptRegisters"
import { JoypadRegister } from "./memory/registers/joypadRegister"

export type Button =
  "A" | "B" | "Start" | "Select" | "Up" | "Down" | "Left" | "Right"

const BUTTONS: Button[] = ["A", "B", "Start", "Select", "Up", "Down", "Left", "Right"]

export default class Controller {
  joypadRegister: JoypadRegister
  interruptRegister: InterruptRegister
  gamepad?: Gamepad

  constructor(memory: Memory) {
    this.joypadRegister = memory.registers.joypad
    this.interruptRegister = memory.registers.interrupts
  }

  isPressed: Record<Button, boolean> = {
    "A": false,
    "B": false,
    "Start": false,
    "Select": false,
    "Up": false,
    "Down": false,
    "Left": false,
    "Right": false,
  }

  keyboardPressed: Record<Button, boolean> = {
    "A": false,
    "B": false,
    "Start": false,
    "Select": false,
    "Up": false,
    "Down": false,
    "Left": false,
    "Right": false,
  }

  htmlPressed: Record<Button, boolean> = {
    "A": false,
    "B": false,
    "Start": false,
    "Select": false,
    "Up": false,
    "Down": false,
    "Left": false,
    "Right": false,
  }

  keyBindings: { [key: string]: Button } = {
    "KeyZ": "A",
    "KeyX": "B",
    "Enter": "Start",
    "Backspace": "Select",
    "ArrowUp": "Up",
    "ArrowDown": "Down",
    "ArrowLeft": "Left",
    "ArrowRight": "Right",
  }

  gamepadBindings: Record<Button, number> = {
    "A": 1,
    "B": 0,
    "Start": 9,
    "Select": 8,
    "Up": 12,
    "Down": 13,
    "Left": 14,
    "Right": 15,
  }

  triggerInterrupt: () => void = () => {}
  updateUi: (isPressed: Record<Button, boolean>) => void = () => {}

  initialiseEvents() {
    document.addEventListener("keydown", e => this.handleKeyPress(e))
    document.addEventListener("keyup", e => this.handleKeyRelease(e))
    window.addEventListener("gamepaddisconnected", (e) => {
      console.log(
        "Gamepad disconnected from index %d: %s",
        e.gamepad.index,
        e.gamepad.id,
      );
      if (this.gamepad?.id == e.gamepad.id) { this.gamepad = undefined }
    });
    window.addEventListener("gamepadconnected", (e) => {
      console.log(
        "Gamepad connected at index %d: %s. %d buttons, %d axes.",
        e.gamepad.index,
        e.gamepad.id,
        e.gamepad.buttons.length,
        e.gamepad.axes.length,
      );
      this.gamepad = e.gamepad
    });
  }

  update() {
    BUTTONS.forEach(button => {
      const isPressed = 
        this.keyboardPressed[button]
        || this.htmlPressed[button]
        || (this.gamepad && this.gamepad.buttons[this.gamepadBindings[button]].pressed)
      isPressed ? this.pressButton(button) : this.releaseButton(button)
    })
    this.updateUi(this.isPressed)
  }

  pressButton(button: Button) {
    if (!this.isPressed[button]) {
      this.interruptRegister.setInterrupt(Interrupt.Joypad)
      this.isPressed[button] = true
      this.joypadRegister[button] = true
    }
  }

  releaseButton(button: Button) {
    if (this.isPressed[button]) {
      this.interruptRegister.setInterrupt(Interrupt.Joypad)
      this.isPressed[button] = false
      this.joypadRegister[button] = false
    }
  }

  handleKeyPress(event: KeyboardEvent) {
    const button = this.keyBindings[event.code]
    if (button) {
      event.preventDefault()
      this.keyboardPressed[button] = true
    }
  }

  handleKeyRelease(event: KeyboardEvent) {
    const button = this.keyBindings[event.code]
    if (button) {
      event.preventDefault()
      this.keyboardPressed[button] = false
    }
  }

  handleHtmlButtonPress(button: Button) {
    this.htmlPressed[button] = true
  }

  handleHtmlButtonRelease(button: Button) {
    this.htmlPressed[button] = false
  }
}