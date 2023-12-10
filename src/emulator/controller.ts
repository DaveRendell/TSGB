import Memory from "./memory"
import { Interrupt, InterruptRegister } from "./memory/registers/interruptRegisters"
import { JoypadRegister } from "./memory/registers/joypadRegister"

export type Button =
  "A" | "B" | "Start" | "Select" | "Up" | "Down" | "Left" | "Right"

export default class Controller {
  joypadRegister: JoypadRegister
  interruptRegister: InterruptRegister
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

  triggerInterrupt: () => void = () => {}
  updateUi: (isPressed: Record<Button, boolean>) => void = () => {}

  initialiseEvents() {
    document.addEventListener("keydown", e => this.handleKeyPress(e))
    document.addEventListener("keyup", e => this.handleKeyRelease(e))
  }

  handleKeyPress(event: KeyboardEvent) {
    const button = this.keyBindings[event.code]
    if (button) {
      event.preventDefault()
      if (!this.isPressed[button]) {
        this.interruptRegister.setInterrupt(Interrupt.Joypad)
      }
      this.isPressed[button] = true
      this.joypadRegister[button] = true
      this.updateUi(this.isPressed)
    }
  }

  handleKeyRelease(event: KeyboardEvent) {
    const button = this.keyBindings[event.code]
    if (button) {
      event.preventDefault()
      if (this.isPressed[button]) {
        this.interruptRegister.setInterrupt(Interrupt.Joypad)
      }
      this.isPressed[button] = false
      this.joypadRegister[button] = false
      this.updateUi(this.isPressed)
    }
  }
}