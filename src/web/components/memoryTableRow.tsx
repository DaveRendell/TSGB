import * as React from "react"
import Memory from "../../emulator/memory"
import { addressDisplay, valueDisplay } from "../helpers/displayHexNumbers"

interface Props {
  address: number
  memory: Memory
  key: number
}

export default function MemoryTableRow({ address, memory }: Props) {
  const [value, setValue] = React.useState(memory.read8(address))
  const [inputValue, setInputValue] = React.useState(valueDisplay(value))

  const update = () => {
    memory.write8(address, parseInt(inputValue))
    setValue(memory.read8(address))
    setInputValue(valueDisplay(value))
  }

  return (
    <tr>
      <td><code>{addressDisplay(address)}</code></td>
      <td><code>{valueDisplay(value)}</code></td>
      <td>{value}</td>
      <td>
        <input
          className="narrow"
          type="text"
          value={inputValue}
          onChange={e => setInputValue(e.target.value)}
        />
      </td>
      <td><button onClick={update}>Update</button></td>
    </tr>
  )
}