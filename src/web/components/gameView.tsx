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
import Settings from "./settings"

interface Props {
  emulator: Emulator
  unload: () => void
}

export default function GameView({ emulator, unload }: Props) {
  // Reload this component when execution of CPU is complete
  const [toggle, setToggle] = React.useState(false)
  const [error, setError] = React.useState<string | undefined>(undefined)

  React.useEffect(() => { emulator.cpu.run() }, [])

  emulator.cpu.onInstructionComplete = () => { setToggle(!toggle) }
  emulator.cpu.onError = (e) => setError(e.message)

  const programCounter = emulator.cpu.registers.PC.value

  return (<main>
      <h1>TSGB</h1>
      <div className="control-buttons">
        <button onClick={() => emulator.cpu.run()}>Run</button>
        <button onClick={() => emulator.cpu.pause()}>Pause</button>
        <button onClick={() => emulator.cpu.runFrame(Infinity)}>Run frame</button>
        <button onClick={() => { emulator.cpu.pause(); unload() }}>Unload</button>
      </div>
      <div className="console">
        <div className="bevel">
          <Display cpu={emulator.cpu} />
        </div>
        <Joypad controller={emulator.controller} />
      </div>
      
      { error &&
        <p>Error: {error}</p>
      }
      <Tabs
        tabs={{
          "Info": () => <p>Title: {emulator.cpu.memory.cartridge?.title}<br/>FPS: {emulator.cpu.fps.toPrecision(2)}</p>,
          "Settings": () => <Settings emulator={emulator} />,
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