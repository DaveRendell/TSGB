import * as React from "react"
import { Emulator } from "../../../emulator/emulator"
import { Interrupt as InterruptEnum} from "../../../emulator/memory/registers/interruptRegisters"
import useAnimationFrame from "../../hooks/useAnimationFrame"

interface Props {
  emulator: Emulator
}

interface Interrupt {
  name: string,
  enabled: boolean,
  requested: boolean,
}

interface State {
  enabled: boolean,
  interrupts: Interrupt[],
}

export default function Interrupts({ emulator }: Props) {

  const state: State = {
    enabled: emulator.cpu.interruptsEnabled,
    interrupts: [
      {
        name: "VBlank",
        enabled: emulator.memory.interruptsEnabled.isEnabled(InterruptEnum.VBlank),
        requested: emulator.memory.registers.interrupts.requested[InterruptEnum.VBlank]
      },
      {
        name: "LCD",
        enabled: emulator.memory.interruptsEnabled.isEnabled(InterruptEnum.LCD),
        requested: emulator.memory.registers.interrupts.requested[InterruptEnum.LCD]
      },
      {
        name: "Timer",
        enabled: emulator.memory.interruptsEnabled.isEnabled(InterruptEnum.Timer),
        requested: emulator.memory.registers.interrupts.requested[InterruptEnum.Timer]
      },
      {
        name: "Serial",
        enabled: emulator.memory.interruptsEnabled.isEnabled(InterruptEnum.Serial),
        requested: emulator.memory.registers.interrupts.requested[InterruptEnum.Serial]
      },
      {
        name: "Joypad",
        enabled: emulator.memory.interruptsEnabled.isEnabled(InterruptEnum.Joypad),
        requested: emulator.memory.registers.interrupts.requested[InterruptEnum.Joypad]
      },
    ]
  }

  return <div>
    <h3>Interrupts</h3>
    Interrupts enabled: <input
      type="checkbox"
      checked={state.enabled}
      disabled
    />
    <table>
      <thead>
        <tr>
          <td></td>
          <td>Enabled</td>
          <td>Requested</td>
        </tr>
      </thead>
      <tbody>
        {state.interrupts.map((interrupt, i) =>
          <tr key={i}>
            <td>{interrupt.name}</td>
            <td>
              <input
                type="checkbox"
                checked={interrupt.enabled}
                disabled
              />
            </td>
            <td>
              <input
                type="checkbox"
                checked={interrupt.requested}
                disabled
              />
            </td>
          </tr>
        )}
      </tbody>
    </table>
  </div>
}