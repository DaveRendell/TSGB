import * as React from "react"

interface Props {
  colours: number[][]
}

const toColour = (values: number[]): string =>
  `#${values.map((x) => Math.round(x).toString(16).padStart(2, "0")).join("")}ff`

export function PaletteDisplay({ colours }: Props) {
  return colours.map(colour =><span
    className="pallete-block"
    style={{ backgroundColor: toColour(colour) }}
  ></span>)
}