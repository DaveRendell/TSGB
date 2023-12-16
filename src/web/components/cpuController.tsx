import * as React from "react"
import CPU from "../../emulator/cpu"
import { FlagName, Register16Name, Register8Name } from "../../types"
import { addressDisplay, valueDisplay } from "../../helpers/displayHexNumbers"

interface Props {
  cpu: CPU
}

const REGISTERS_8_BIT: Register8Name[] = [
  "A", "B", "C", "D", "E", "F", "H", "L"
]
const REGISTERS_16_BIT: Register16Name[] = [
  "HL", "PC", "SP", "BC", "DE", "AF"
]
const FLAGS: string[] = [
  "zero", "operation", "halfCarry", "carry"
]

export default function CpuController({ cpu }: Props) {

  return (<section>
    <h2>CPU Controller</h2>
    FPS: {cpu.fps.toPrecision(2)}<br/>
    <button onClick={() => cpu.executeNextInstruction()}>Execute next instruction</button>
    <button onClick={() => cpu.run()}>Run until halt</button>
    <button onClick={() => cpu.runFrame(Infinity)}>Run frame</button>
    <button onClick={() => cpu.pause()}>Pause</button>
    <button onClick={() => {
      const link = document.createElement("a")
      const content = cpu.gbDoctorLog
      const file = new Blob([content], { type: 'text/plain' });
      link.href = URL.createObjectURL(file);
      link.download = "sample.txt";
      link.click();
      URL.revokeObjectURL(link.href);
    }}>Download GB Doctor Log</button>
    Is halted: {cpu.isHalted.toString()}
    <h3>Registers</h3>
    <div className="flex-horizontally">
      <div>
        <h4>8-bit registers</h4>
        <table>
          <tbody>
            {REGISTERS_8_BIT.map(reg =>
              <tr key={reg}>
                <td>{reg}</td>
                <td>{valueDisplay(cpu.registers[reg].value)}</td>
              </tr>)}
          </tbody>
        </table>
      </div>
      <div>
        <h4>16-bit registers</h4>
        <table>
          <tbody>
            {REGISTERS_16_BIT.map(reg =>
              <tr key={reg}>
                <td>{reg}</td>
                <td>{addressDisplay(cpu.registers[reg].value)}</td>
              </tr>)}
          </tbody>
        </table>
      </div>
      <div>
        <h4>Flags</h4>
        <table>
          <tbody>
            {FLAGS.map(reg =>
              <tr key={reg}>
                <td>{reg}</td>
                <td>{cpu.registers.F[reg].read}</td>
              </tr>)}
          </tbody>
        </table>
      </div>
      
    </div>
    
  </section>)
}