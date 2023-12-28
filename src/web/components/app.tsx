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
import AudioDebug from "./audioDebug"
import { Emulator } from "../../emulator/emulator"

interface Props {
  emulator: Emulator
}

export default function App({ emulator }: Props) {
  // Reload this component when execution of CPU is complete
  const [toggle, setToggle] = React.useState(false)
  emulator.cpu.onInstructionComplete = () => { setToggle(!toggle) }

  const [error, setError] = React.useState<string | undefined>(undefined)
  emulator.cpu.onError = (e) => setError(e.message)

  const programCounter = emulator.cpu.registers.PC.value

  return (<main>
      <h1>TSGB</h1>
    
      <GameLoader memory={emulator.cpu.memory} />
      <br/>
      <button onClick={() => emulator.cpu.run()}>Run</button>
      <button onClick={() => emulator.cpu.pause()}>Pause</button>
      <button onClick={() => emulator.cpu.runFrame(Infinity)}>Run frame</button>
      <Display cpu={emulator.cpu} />
      { error &&
        <p>Error: {error}</p>
      }
      <Joypad controller={emulator.controller} />
      <Tabs
        tabs={{
          "Info": () => <p>Title: {emulator.cpu.memory.cartridge?.title}</p>,
          "Debug Graphics": () => <>
            <VramViewer ppu={new PPU(emulator.cpu)} />
          </>,
          "Debug Sound": () => <AudioDebug apu={emulator.apu} />,
          "Debug Memory": () => <>
            <CpuController cpu={emulator.cpu} />
            <MemoryExplorer
              memory={emulator.cpu.memory}
              programCounter={programCounter}
              breakpoints={emulator.cpu.breakpoints}
            />
          </>
        }}
      />
    </main>)
}