import * as React from "react"
import CodeDebugger from "./memoryDebug/codeDebugger"
import Display from "./display"
import Joypad from "./joypad"
import Tabs from "./tabs"
import AudioDebug from "./audioDebug"
import { Emulator, EmulatorMode } from "../../emulator/emulator"
import Settings from "./settings/settings"
import PkmnGen1Dashboard from "../gameDashboards/pkmnGen1Dashboard"
import { GraphicsDebug } from "./graphicsDebug/graphicsDebug"
import { Info } from "./info"
import SerialPort from "./serialPort"
import SuperDebug from "./superDebug/superDebug"

interface Props {
  emulator: Emulator
  unload: () => void
}

export default function GameView({ emulator, unload }: Props) {
  // Reload this component when execution of CPU is complete
  const [toggle, setToggle] = React.useState(false)
  const [error, setError] = React.useState<string | undefined>(undefined)
  const [showMenu, setShowMenu] = React.useState(false)

  React.useEffect(() => {
    const interval = setInterval(() => setToggle((t) => !t), 1000)
    return () => {
      clearInterval(interval)
    }
  }, [])

  // emulator.cpu.onInstructionComplete = () => { setToggle(!toggle) }
  emulator.cpu.onError = (e) => setError(e.message)

  const tabs = {
    Info: () => <Info emulator={emulator} />,
    Settings: () => <Settings emulator={emulator} />,
    "Serial Port": () => <SerialPort emulator={emulator} />,
    "Debug Graphics": () => <GraphicsDebug emulator={emulator} />,
    "Debug Sound": () => (
      <AudioDebug audioProcessor={emulator.audioProcessor} />
    ),
    "Debug Code": () => <CodeDebugger emulator={emulator} />,
  }

  if (emulator.mode === EmulatorMode.SGB) {
    tabs["Debug Super"] = () => <SuperDebug emulator={emulator} />
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
        <button className="chunky-button" onClick={() => emulator.cpu.runBrowserFrame(Infinity)}>
          Next frame
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
      <br/>
      {showMenu 
        ? <>
          <button className="chunky-button action-button" onClick={() => setShowMenu(false)}>Hide Menu</button>
          <Tabs tabs={tabs} />
        </>
        : <>
          <button className="chunky-button action-button" onClick={() => setShowMenu(true)}>Show Menu</button>
        </>}
      
    </main>
  )
}
