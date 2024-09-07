import * as React from "react"
import { Emulator } from "../../../emulator/emulator"

interface Props {
  focus: number
  pc: number
  nextAddress: number
  previousAddress: number
  setFocus: (focus: number) => void
}

export default function FocusControl({
  focus, pc, previousAddress, nextAddress, setFocus
}: Props) {
  const [followPc, setFollowPc] = React.useState(true)
  const [focusDisplay, setFocusDisplay] = React.useState(focus)

  const jump = () => {
    setFollowPc(false)
    setFocus(focusDisplay)
  }

  const previous = () => {
    if (previousAddress !== undefined) {
      setFollowPc(false)
      setFocusDisplay(previousAddress)
      setFocus(previousAddress)
    }
  }

  const next = () => {
    setFollowPc(false)
    setFocusDisplay(nextAddress)
    setFocus(nextAddress)
  }

  React.useEffect(() => {
    if (followPc) {
      setFocusDisplay(pc)
      setFocus(pc)
    }
  }, [pc, followPc])

  return <div className="flex-horizontally">
    <label htmlFor="focus">Focus</label>

    <button onClick={previous}>{"<"}</button>
    <button onClick={next}>{">"}</button>

    <input
      type="text"
      name="focus"
      value={focusDisplay.toString(16)}
      onChange={(e) => setFocusDisplay(parseInt("0x" + e.target.value))}
    />

    <button onClick={jump}>Jump</button>

    <input
      type="checkbox"
      name="follow-pc"
      checked={followPc}
      onChange={(e) => setFollowPc(e.target.checked)}
    />
    <label htmlFor="follow-pc">Follow PC</label>
  </div>
}