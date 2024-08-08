import * as React from "react"

interface Props {
  colours: number[][]
  values?: number[][]
}

const toColour = (values: number[]): string =>
  `#${values.map((x) => Math.round(x).toString(16).padStart(2, "0")).join("")}ff`

export function PaletteDisplay({ colours, values }: Props) {
  return <span>{colours.map(colour => <span
      className="pallete-block"
      style={{ backgroundColor: toColour(colour) }}
    ></span>)}
    {values && <> - <code>{values.map(value =>
      value.map(x =>
      x).join(",")).map(s => `(${s})`).join(" ")}
      </code></>}
  </span>
}