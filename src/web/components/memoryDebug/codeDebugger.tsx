import * as React from "react"
import { addressDisplay } from "../../../helpers/displayHexNumbers"
import { Emulator } from "../../../emulator/emulator"
import Stack from "./stack"
import Registers from "./registers"
import FlagsDisplay from "./flagsDisplay"
import Interrupts from "./interrupts"
import CodeDisplay from "./codeDisplay"
import CpuController from "./cpuController"
import { mutateGame, updateGame } from "../../indexedDb/gameStore"
import Breakpoints from "./breakpoints"

interface Props {
  emulator: Emulator
}

export default function CodeDebugger({ emulator }: Props) {
  const breakpoints = emulator.cpu.breakpoints


  // Enable breakpoints when this tab is open
  React.useEffect(() => {
    emulator.cpu.debuggingEnabled = true
    console.log("Setting debuggingEnabled", emulator.cpu.debuggingEnabled)
    return () => {
      emulator.cpu.debuggingEnabled = false
      console.log("Disabling debuggingEnabled", emulator.cpu.debuggingEnabled)
    }
  }, [emulator])

  

  if (emulator.cpu.running) {
    return <section>
      Pause emulation to debug game code
    </section>
  }

  return (
    <section>
      <h2>Code debugger</h2>
      <div className="flex-horizontally">
        <CodeDisplay
          emulator={emulator}
          linesAbove={10}
          linesBelow={30}
        />
        <div className="tools-panel">
          <CpuController cpu={emulator.cpu} />
          <Stack emulator={emulator} />
          <Registers emulator={emulator} />
          <FlagsDisplay flagsRegister={emulator.cpu.registers.F} />
          <Interrupts emulator={emulator} />
          <Breakpoints emulator={emulator} />
        </div>
      </div>
    </section>
  )
}
