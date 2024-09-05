import * as React from "react"
import SuperEmulator from "../../../emulator/super/superEmulator"

interface Props {
  superEmulator: SuperEmulator
}

export default function CommandLog({ superEmulator }: Props) {
  const clearLog = () => {
    superEmulator.commandLog = []
  }

  return <section>
    <button onClick={clearLog}>Clear</button>
    <pre className="command-log">
      {superEmulator.commandLog.join("\n")}
    </pre>
  </section>
}
