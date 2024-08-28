import * as React from "react"
import { Emulator } from "../../../emulator/emulator"
import findSymbol from "../../../emulator/debug/findSymbol"
import findSection from "../../../emulator/debug/findSection"
import useAnimationFrame from "../../hooks/useAnimationFrame"

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
      const section = findSection(emulator.debugMap, address, emulator.memory)
      if (!section) {
        return formattedAddress
      }
      return `${section.name}+${address - section.start} ${formattedAddress}`
    }

    if (symbol.address === address) {
      return `${symbol.name} ${formattedAddress}`
    }

    return `${symbol.name}+${address - symbol.address} ${formattedAddress}`
  }

  const stack = [...emulator.cpu.debugCallStack].reverse()

  return <>
    <h3>Call stack</h3>
    <ol>
      <li>PC: {getLabelForAddress(emulator.cpu.registers.PC.word)}</li>
      {stack.slice(0, 9).map(address =>
        <li>{getLabelForAddress(address)}</li>
      )}
    </ol>
    {stack.length > 9 && <span>{stack.length - 9} entries hidden</span>}
  </>
}
