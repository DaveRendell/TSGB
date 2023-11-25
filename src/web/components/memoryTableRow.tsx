import * as React from "react"
import Memory from "../../emulator/memory"
import { addressDisplay, valueDisplay } from "../helpers/displayHexNumbers"

interface Props {
  address: number
  memory: Memory
  programCounter: number
  key: number
}

export default function MemoryTableRow({
  address, memory, programCounter
}: Props) {
  const [value, setValue] = React.useState(memory.at(address).read())
  const [inputValue, setInputValue] = React.useState(valueDisplay(value))

  const update = () => {
    memory.at(address).write(parseInt(inputValue))
    setValue(memory.at(address).read())
    setInputValue(valueDisplay(value))
  }

  return (
    <tr>
      <td>{programCounter === address ? "PC ->" : " "}</td>
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