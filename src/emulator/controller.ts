import Memory from "./memory/memoryMap"
import {
  Interrupt,
  InterruptRegister,
} from "./memory/registers/interruptRegisters"
import { JoypadRegister } from "./memory/registers/joypadRegister"

export type Button =
  | "A"
  | "B"
  | "Start"
  | "Select"
  | "Up"
  | "Down"
  | "Left"
  | "Right"

export const BUTTONS: Button[] = [
  "A",
  "B",
  "Start",
  "Select",
  "Up",
  "Down",
  "Left",
  "Right",
]

export default class Controller {
  joypadRegister: JoypadRegister
  interruptRegister: InterruptRegister
  gamepad?: Gamepad

  isPressed: Record<Button, boolean> = {
    A: false,
    B: false,
    Start: false,
    Select: false,
    Up: false,
    Down: false,
    Left: false,
    Right: false,
  }

  keyboardPressed: Record<Button, boolean> = {
    A: false,
    B: false,
    Start: false,
    Select: false,
    Up: false,
    Down: false,
    Left: false,
    Right: false,
  }

  htmlPressed: Record<Button, boolean> = {
    A: false,
    B: false,
    Start: false,
    Select: false,
    Up: false,
    Down: false,
    Left: false,
    Right: false,
  }

  keyboardBindings: Record<Button, string[]> = {
    "A": ["KeyZ"],
    "B": ["KeyX"],
    "Start": ["Enter"],
    "Select": ["Backspace"],
    "Up": ["ArrowUp"],
    "Down": ["ArrowDown"],
    "Left": ["ArrowLeft"],
    "Right": ["ArrowRight"],
  }

  keyMap: { [key: string]: Button } = {}

  gamepadBindings: Record<Button, number[]> = {
    A: [1],
    B: [0],
    Start: [9],
    Select: [8],
    Up: [12],
    Down: [13],
    Left: [14],
    Right: [15],
  }

  triggerInterrupt: () => void = () => {}
  updateUi: (isPressed: Record<Button, boolean>) => void = () => {}

  constructor(memory: Memory) {
    this.joypadRegister = memory.registers.joypad
    this.interruptRegister = memory.registers.interrupts

    const storedKeyBindings = window.localStorage.getItem("keyboardBindings")
    if (storedKeyBindings) {
      this.keyboardBindings = JSON.parse(storedKeyBindings)
    }

    const storedPadBindings = window.localStorage.getItem("gamepadBindings")
    if (storedPadBindings) {
      this.gamepadBindings = JSON.parse(storedPadBindings)
    }

    this.setKeyMap()
  }

  setKeyMap() {
    this.keyMap = {}
    BUTTONS.forEach(button => {
      const keys = this.keyboardBindings[button]
      keys.forEach(key => {
        this.keyMap[key] = button
      })
    })
  }

  initialiseEvents() {
    document.addEventListener("keydown", (e) => this.handleKeyPress(e))
    document.addEventListener("keyup", (e) => this.handleKeyRelease(e))
    window.addEventListener("gamepaddisconnected", (e) => {
      console.log(
        "Gamepad disconnected from index %d: %s",
        e.gamepad.index,
        e.gamepad.id,
      )
      if (this.gamepad?.id == e.gamepad.id) {
        this.gamepad = undefined
      }
    })
    window.addEventListener("gamepadconnected", (e) => {
      console.log(
        "Gamepad connected at index %d: %s. %d buttons, %d axes.",
        e.gamepad.index,
        e.gamepad.id,
        e.gamepad.buttons.length,
        e.gamepad.axes.length,
      )
      this.gamepad = e.gamepad
    })
  }

  update() {
    BUTTONS.forEach((button) => {
      const isPressed =
        this.keyboardPressed[button] ||
        this.htmlPressed[button] ||
        (this.gamepad &&
          this.gamepadBindings[button].some(gamepadButton =>
            this.gamepad.buttons[gamepadButton].pressed
          ))
      isPressed ? this.pressButton(button) : this.releaseButton(button)
    })
  }

  pressButton(button: Button) {
    if (!this.isPressed[button]) {
      this.interruptRegister.setInterrupt(Interrupt.Joypad)
      this.isPressed[button] = true
      this.joypadRegister[button] = true
      this.updateUi(this.isPressed)
    }
  }

  releaseButton(button: Button) {
    if (this.isPressed[button]) {
      this.interruptRegister.setInterrupt(Interrupt.Joypad)
      this.isPressed[button] = false
      this.joypadRegister[button] = false
      this.updateUi(this.isPressed)
    }
  }

  handleKeyPress(event: KeyboardEvent) {
    const button = this.keyMap[event.code]
    if (button) {
      event.preventDefault()
      this.keyboardPressed[button] = true
    }
  }

  handleKeyRelease(event: KeyboardEvent) {
    const button = this.keyMap[event.code]
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
