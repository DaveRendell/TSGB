import * as React from "react"
import Memory from "../../emulator/memory"
import MemoryExplorer from "./memoryExplorer"

interface Props {
  memory: Memory
}

export default function App({ memory }) {
  return (<main>
      <h1>TSGB</h1>
      <MemoryExplorer memory={memory} />
    </main>)
}