import * as React from "react"
import { Emulator } from "../../../emulator/emulator"
import SuperPalettes from "./superPalettes"
import AttributeDebug from "./attributeDebug"
import CommandLog from "./commandLog"

interface Props {
  emulator: Emulator
}

type SuperDebugTab =
  "Command Log"
  | "Palettes"
  | "Attributes"

export default function SuperDebug({ emulator }: Props) {
  const [tab, setTab] = React.useState<SuperDebugTab>("Command Log")

  const getTab = () => {
    switch(tab) {
      case "Command Log":
        return <CommandLog superEmulator={emulator.superEmulator} />
      case "Palettes":
        return <SuperPalettes superEmulator={emulator.superEmulator} />
      case "Attributes":
        return <AttributeDebug superEmulator={emulator.superEmulator} />
    }
  }
  
  return (<section>
    <h2>Graphics debug</h2>
    <select value={tab.toString()} onChange={e => setTab(e.target.value as SuperDebugTab)}>
      <option id="Command Log">Command Log</option>
      <option id="Palettes">Palettes</option>
      <option id="Attributes">Attributes</option>
    </select>
    <br />
    { getTab() }
  </section>)
}