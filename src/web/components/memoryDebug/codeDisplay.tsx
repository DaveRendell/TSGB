import * as React from "react"
import { Emulator } from "../../../emulator/emulator"
import getCodeAroundAddress from "./getCodeAroundAddress"
import { addressDisplay } from "../../../helpers/displayHexNumbers"

interface Props {
  focus: number,
  linesAbove: number,
  linesBelow: number,
  emulator: Emulator,
}

export default function CodeDisplay({ focus, linesAbove, linesBelow, emulator }) {
  const lines = getCodeAroundAddress(focus, emulator, linesAbove, linesBelow)

  return <code>
    {lines.map(line =>
      <><span>{addressDisplay(line.address)}</span>{" "}<span>{line.asCode}</span><br/></>
    )}
  </code>
}