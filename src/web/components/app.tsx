import * as React from "react"
import MemoryExplorer from "./memoryExplorer"
import CPU from "../../emulator/cpu"
import CpuController from "./cpuController"
import GameLoader from "./gameLoader"
import PPU from "../../emulator/ppu"
import { VramViewer } from "./vramViewer"
import Display from "./display"
import APU from "../../emulator/apu"
import Joypad from "./joypad"
import Controller from "../../emulator/controller"
import Tabs from "./tabs"

interface Props {
  cpu: CPU
  ppu: PPU
  apu: APU
  controller: Controller
}

export default function App({ cpu, ppu, apu, controller }: Props) {
  // Reload this component when execution of CPU is complete
  const [toggle, setToggle] = React.useState(false)
  cpu.onInstructionComplete = () => { setToggle(!toggle) }

  const [error, setError] = React.useState<string | undefined>(undefined)
  cpu.onError = (e) => setError(e.message)

  const programCounter = cpu.registers.PC.value

  return (<main>
      <h1>TSGB</h1>
    
      <GameLoader memory={cpu.memory} />
      <br/>
      <button onClick={() => cpu.run()}>Run</button>
      <button onClick={() => cpu.pause()}>Pause</button>
      <button onClick={() => cpu.runFrame(Infinity)}>Run frame</button>
      <Display cpu={cpu} />
      { error &&
        <p>Error: {error}</p>
      }
      <Joypad controller={controller} />
      <Tabs
        tabs={{
          "Info": () => <p>Test</p>,
          "Debug Graphics": () => <>
            <VramViewer ppu={ppu} />
          </>,
          "Debug Sound": () => <p>To do!</p>,
          "Debug Memory": () => <>
            <CpuController cpu={cpu} />
            <MemoryExplorer
              memory={cpu.memory}
              programCounter={programCounter}
              breakpoints={cpu.breakpoints}
            />
          </>
        }}
      />
    </main>)
}