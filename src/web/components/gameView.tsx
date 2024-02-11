import * as React from "react"
import MemoryExplorer from "./memoryExplorer"
import CpuController from "./cpuController"
import PPU from "../debugPicture"
import { VramViewer } from "./vramViewer"
import Display from "./display"
import Joypad from "./joypad"
import Tabs from "./tabs"
import AudioDebug from "./audioDebug"
import { Emulator } from "../../emulator/emulator"
import Settings from "./settings"
import PkmnGen1Dashboard from "../gameDashboards/pkmnGen1Dashboard"

interface Props {
  emulator: Emulator
  unload: () => void
}

export default function GameView({ emulator, unload }: Props) {
  // Reload this component when execution of CPU is complete
  const [toggle, setToggle] = React.useState(false)
  const [error, setError] = React.useState<string | undefined>(undefined)

  React.useEffect(() => {
    emulator.cpu.run()
  }, [])

  React.useEffect(() => {
    const interval = setInterval(() => setToggle((t) => !t), 1000)
    return () => {
      clearInterval(interval)
    }
  }, [])

  // emulator.cpu.onInstructionComplete = () => { setToggle(!toggle) }
  emulator.cpu.onError = (e) => setError(e.message)

  const programCounter = emulator.cpu.registers.PC.word

  const tabs = {
    Info: () => (
      <p>
        Title: {emulator.cpu.memory.cartridge?.title}
        <br />
        FPS: {emulator.cpu.fps.toPrecision(2)}
        <br />
        Frame time:{" "}
        {(emulator.cpu.averageRecentFrameTime / 60).toPrecision(3)} /
        16.7ms
      </p>
    ),
    Settings: () => <Settings emulator={emulator} />,
    "Debug Graphics": () => (
      <>
        <VramViewer ppu={new PPU(emulator.cpu)} emulator={emulator} />
      </>
    ),
    "Debug Sound": () => (
      <AudioDebug audioProcessor={emulator.audioProcessor} />
    ),
    "Debug Memory": () => (
      <>
        <CpuController cpu={emulator.cpu} />
        <MemoryExplorer
          memory={emulator.cpu.memory}
          programCounter={programCounter}
          breakpoints={emulator.cpu.breakpoints}
        />
      </>
    ),
  }

  if (emulator.memory.cartridge.title.includes("POKEMON RED")
  || emulator.memory.cartridge.title.includes("POKEMON BLUE")) {
    tabs["Dashboard"] = () => <PkmnGen1Dashboard emulator={emulator} />
  }

  return (
    <main>
      <div className="control-buttons floating-panel">
        <button className="chunky-button" onClick={() => emulator.cpu.run()}>Run</button>
        <button className="chunky-button" onClick={() => emulator.cpu.pause()}>Pause</button>
        <button className="chunky-button" onClick={() => emulator.cpu.runFrame(Infinity)}>
          Run frame
        </button>
        <button className="chunky-button"
          onClick={() => {
            emulator.cpu.pause()
            unload()
          }}
        >
          Unload
        </button>
      </div>
      <div className="console">
        <div className="bevel">
          <Display cpu={emulator.cpu} />
        </div>
        <Joypad controller={emulator.controller} />
      </div>

      {error && <p>Error: {error}</p>}
      <Tabs
        tabs={tabs}
      />
    </main>
  )
}
