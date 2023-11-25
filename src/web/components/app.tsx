import * as React from "react"
import MemoryExplorer from "./memoryExplorer"
import CPU from "../../emulator/cpu"
import CpuController from "./cpuController"

interface Props {
  cpu: CPU
}

export default function App({ cpu }: Props) {
  
  // Reload this component when execution of CPU is complete
  const [toggle, setToggle] = React.useState(false)
  cpu.onInstructionComplete = () => { setToggle(!toggle) }

  const programCounter = cpu.registers.get16("PC").read()

  return (<main>
      <h1>TSGB</h1>
      <CpuController cpu={cpu} />
      <MemoryExplorer memory={cpu.memory} programCounter={programCounter} />
    </main>)
}