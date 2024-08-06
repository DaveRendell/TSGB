import * as React from "react"
import { Emulator } from "../../../emulator/emulator"
import SuperPalettes from "./superPalettes"

interface Props {
  emulator: Emulator
}

type SuperDebugTab =
  "Palettes"

export default function SuperDebug({ emulator }: Props) {
  const [tab, setTab] = React.useState<SuperDebugTab>("Palettes")

  const getTab = () => {
    switch(tab) {
      case "Palettes":
        return <SuperPalettes superEmulator={emulator.superEmulator} />
    }
  }
  
  return (<section>
    <h2>Graphics debug</h2>
    <select value={tab.toString()} onChange={e => setTab(e.target.value as SuperDebugTab)}>
      <option id="Palettes">Palettes</option>
    </select>
    <br />
    { getTab() }
  </section>)
}