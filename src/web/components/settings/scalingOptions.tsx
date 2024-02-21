import * as React from "react"

type Scaling = "Crisp" | "Smooth"

export function ScalingOptions() {
  const [scaling, setScaling] = React.useState<Scaling>(
    document.getElementsByClassName("screen").item(0).classList.contains("pixelated")
     ? "Crisp"
     : "Smooth"
  )

  const updateScaling = (scaling: Scaling) => () => {
    const screen = document.getElementsByClassName("screen").item(0)
    if (scaling === "Crisp") {
      screen.classList.add("pixelated")
    } else {
      screen.classList.remove("pixelated")
    }
    setScaling(scaling)
  }

  return <>
    <h3>Scaling type</h3>
    <input
      type="radio"
      id="sc_crisp"
      name="scaling"
      value="crisp"
      checked={scaling === "Crisp"}
      onChange={updateScaling("Crisp")}
    />
    <label htmlFor="sc_crisp">Crisp</label><br/>
    <input
      type="radio"
      id="sc_smooth"
      name="scaling"
      value="smooth"
      checked={scaling === "Smooth"}
      onChange={updateScaling("Smooth")}
    />
    <label htmlFor="sc_smooth">Smooth</label><br/>
  </>
}