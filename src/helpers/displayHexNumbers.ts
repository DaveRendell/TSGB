export const valueDisplay = (value: number) =>
  "$" + value.toString(16).padStart(2, "0")

export const addressDisplay = (address: number) =>
  "$" + address.toString(16).padStart(4, "0")
