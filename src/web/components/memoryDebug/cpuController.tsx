import * as React from "react"
import CPU from "../../../emulator/cpu/cpu"
import { FlagName, Register16Name, Register8Name } from "../../../types"
import { addressDisplay, valueDisplay } from "../../../helpers/displayHexNumbers"

interface Props {
  cpu: CPU
}

export default function CpuController({ cpu }: Props) {
  const step = () => {
    const currentStackDepth = cpu.debugCallStack.length
    do {
      cpu.executeInstruction()
    } while (cpu.debugCallStack.length > currentStackDepth)
  }

  const stepInto = () => {
    cpu.executeInstruction()
  }

  const stepOut = () => {
    const currentStackDepth = cpu.debugCallStack.length
    while (cpu.debugCallStack.length >= currentStackDepth) {
      cpu.executeInstruction()
    }
  }

  const run = () => {
    cpu.run()
  }

  const pause = () => {
    cpu.pause()
  }


  return (
    <section>
      {cpu.running
        ? <button className="cpu-control-button" onClick={() => pause()}>⏸ Pause</button>
        : <button className="cpu-control-button" onClick={() => run()}>▶ Run</button>
      }
      <button className="cpu-control-button" onClick={() => step()}>➡ Step</button>
      <button className="cpu-control-button" onClick={() => stepInto()}>↘ Step in</button>
      <button className="cpu-control-button" onClick={() => stepOut()}>↗ Step out</button>
    </section>
  )
}
