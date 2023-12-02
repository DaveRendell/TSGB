import * as React from "react"
import MemoryExplorer from "./memoryExplorer"
import CPU from "../../emulator/cpu"
import CpuController from "./cpuController"
import GameLoader from "./gameLoader"
import PPU from "../../emulator/ppu"
import { VramViewer } from "./vramViewer"
import Display from "./display"
import APU from "../../emulator/apu"

interface Props {
  cpu: CPU
  ppu: PPU
  apu: APU
}

export default function App({ cpu, ppu, apu }: Props) {
  // Reload this component when execution of CPU is complete
  const [toggle, setToggle] = React.useState(false)
  cpu.onInstructionComplete = () => { setToggle(!toggle) }

  const programCounter = cpu.registers.get16("PC").read()

  return (<main>
      <h1>TSGB</h1>
      <GameLoader memory={cpu.memory} />
      <Display cpu={cpu} />
      <CpuController cpu={cpu} />
      <VramViewer ppu={ppu} />
      <MemoryExplorer
        memory={cpu.memory}
        programCounter={programCounter}
        breakpoints={cpu.breakpoints}
      />
    </main>)
}