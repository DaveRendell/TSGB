import * as React from "react"
import SuperEmulator from "../../../emulator/super/superEmulator"

interface Props {
  superEmulator: SuperEmulator
}

export default function AttributeDebug({ superEmulator }: Props) {
  return <pre>
    { superEmulator.attributes.data.map(row =>
      row.join(" ")
    ).join("\n")}
  </pre>
}