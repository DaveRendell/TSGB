import * as React from "react"
import Memory from "../../emulator/memory"
import { addressDisplay } from "../helpers/displayHexNumbers"
import MemoryTableRow from "./memoryTableRow"

interface Props {
  memory: Memory
}

export default function MemoryExplorer({ memory }: Props) {
  const [baseAddress, setBaseAddress] = React.useState(0x0000)
  const [length, setLength] = React.useState(25)

  const [baseAddressInput, setBaseAddressInput] = React.useState(addressDisplay(baseAddress))
  const [lengthInput, setLengthInput] = React.useState(length)

  const update = () => {
    setLength(lengthInput)
    setBaseAddress(parseInt(baseAddressInput))
  }

  const addresses = Array.from({ length }, (_, i) => baseAddress + i)

  return (<section>
    <h2>Memory Explorer</h2>
    Showing <input
      className="narrow"
      type="number"
      value={lengthInput}
      onChange={e => setLength(parseInt(e.target.value))}
    /> values starting at
    address <input 
      className="narrow"
      value={baseAddressInput}
      type="text"
      onChange={e => setBaseAddressInput(e.target.value)}
    /> <button onClick={update}>Update</button>

    <table className="memory-table">
      <thead>
        <tr>
          <th>Address</th>
          <th>Hex</th>
          <th>Dec</th>
          <th>Update</th>
        </tr>
      </thead>
      <tbody>
        { addresses.map(address => <MemoryTableRow
          key={address}
          address={address}
          memory={memory} 
        />)}
      </tbody>
      
    </table>
  </section>)
}