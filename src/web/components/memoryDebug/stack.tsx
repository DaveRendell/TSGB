import * as React from "react"
import { Emulator } from "../../../emulator/emulator"
import findSymbol from "../../../emulator/debug/findSymbol"

interface Props {
  emulator: Emulator
}

export default function Stack({ emulator }: Props) {
  const getLabelForAddress = (address: number) => {
    const formattedAddress = "[0x" + address.toString(16).padStart(4, "0") + "]"
    if (!emulator.debugMap) {
      return formattedAddress
    }

    const symbol = findSymbol(emulator.debugMap, address, emulator.memory)

    if (!symbol) {
      return formattedAddress
    }

    if (symbol.address === address) {
      return `${symbol.name} ${formattedAddress}`
    }

    return `${symbol.name}+${address - symbol.address} ${formattedAddress}`
  }

  return <>
    <h3>Call stack</h3>
    <ol>
      {emulator.cpu.debugCallStack.map(address =>
        <li>{getLabelForAddress(address)}</li>
      )}
    </ol>
  </>
}
