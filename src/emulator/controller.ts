export type Button =
  "A" | "B" | "Start" | "Select" | "Up" | "Down" | "Left" | "Right"

export default class Controller {
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
      if (!this.isPressed[button]) { this.triggerInterrupt() }
      this.isPressed[button] = true
      this.updateUi(this.isPressed)
    }
  }

  handleKeyRelease(event: KeyboardEvent) {
    const button = this.keyBindings[event.code]
    if (button) {
      event.preventDefault()
      if (this.isPressed[button]) { this.triggerInterrupt() }
      this.isPressed[button] = false
      this.updateUi(this.isPressed)
    }
  }

  getButtonNibble(): number {
    return (this.isPressed["Start"] ? 0 : 0x8)
      + (this.isPressed["Select"] ? 0 : 0x4)
      + (this.isPressed["B"] ? 0 : 0x2)
      + (this.isPressed["A"] ? 0 : 0x1)
  }

  getDPadNibble(): number {
    return (this.isPressed["Down"] ? 0 : 0x8)
      + (this.isPressed["Up"] ? 0 : 0x4)
      + (this.isPressed["Left"] ? 0 : 0x2)
      + (this.isPressed["Right"] ? 0 : 0x1)
  }

  updatedRegister(originalValue: number): number {
    const selectButtons = (originalValue >> 4) === 1
    const selectDpad = (originalValue >> 5) === 1

    if (selectButtons) {
      return (originalValue & 0xF0) + this.getButtonNibble()
    }
    if (selectDpad) {
      return (originalValue & 0xF0) + this.getDPadNibble()
    }
    return (originalValue & 0xF0) + 0xF
  }
}