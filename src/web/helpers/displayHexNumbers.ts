export const valueDisplay = (value: number) =>
  "0x" + value.toString(16).toUpperCase().padStart(2, "0")

export const addressDisplay = (address: number) =>
  "0x" + address.toString(16).toUpperCase().padStart(4, "0")
