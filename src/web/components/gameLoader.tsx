import * as React from "react"
import Memory from "../../emulator/memory"
import useLocalFile from "../hooks/useLocalFile"
import { Cartridge } from "../../emulator/memory/cartridges/cartridge"
import { createCartridge } from "../../emulator/memory/cartridges/createCartridge"

interface Props {
  setCartridge: (cartridge: Cartridge) => void
}

const SAMPLE_LENGTH = 2 << 16
const SAMPLE_DEPTH = 64

function createBuffer7(): Float32Array {
  const values = new Float32Array(SAMPLE_DEPTH * SAMPLE_LENGTH)
  let lsfr = 0
  for (let i = 0; i < SAMPLE_LENGTH; i++) {
    let shift = lsfr >> 1
    const b0 = lsfr & 1
    const b1 = shift & 1
    const carry = 1 - (b0 ^ b1)
    shift &= 0b01111111
    shift |= (carry << 7)
    lsfr = shift
    const value = carry ? 1 : -1
    for (let j = 0; j < SAMPLE_DEPTH; j++) {
      values[i * SAMPLE_DEPTH + j] = value
    }
  }
  return values
}

function createBuffer15(): Float32Array {
  const values = new Float32Array(SAMPLE_DEPTH * SAMPLE_LENGTH)
  let lsfr = 0
  for (let i = 0; i < SAMPLE_LENGTH; i++) {
    let shift = lsfr >> 1
    const b0 = lsfr & 1
    const b1 = shift & 1
    const carry = 1 - (b0 ^ b1)
    shift &= 0b0111111111111111
    shift |= (carry << 15)
    lsfr = shift
    const value = carry ? 1 : -1
    for (let j = 0; j < SAMPLE_DEPTH; j++) {
      values[i * SAMPLE_DEPTH + j] = value
    }
  }
  return values
}

function testNoise() {
  const audioContext = new AudioContext({ sampleRate: 44100 })

  const shift = 0
  const divider = 0.5
  const bitFreq = 262144 / (divider * (2 << shift))
  const sampleRate = audioContext.sampleRate
  const playRate = bitFreq / sampleRate



  const buffer = audioContext.createBuffer(1, SAMPLE_DEPTH * SAMPLE_LENGTH, audioContext.sampleRate)
  buffer.copyToChannel(createBuffer7(), 0)
  const node = audioContext.createBufferSource()
  node.buffer = buffer
  node.playbackRate.value = SAMPLE_DEPTH * playRate



  const gain = audioContext.createGain()
  gain.gain.setValueAtTime(1, audioContext.currentTime)
  gain.gain.setTargetAtTime(0, audioContext.currentTime + 0.5, 0.1)

  node.connect(gain)
  gain.connect(audioContext.destination)
  node.start()
  node.stop(1)
}

export default function GameLoader({ setCartridge }: Props) {
  const [gameFile, setGameFile] = useLocalFile("game.gb")


  const handleGameUpload = async function(e: React.ChangeEvent<HTMLInputElement>) {
    e.preventDefault()
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      setGameFile(file)
      if (gameFile) {
        setCartridge(await createCartridge(gameFile))
      }   
    }
  }

  const loadGame = async () => {
    if (gameFile) {
      setCartridge(await createCartridge(gameFile))
    }    
  }

  return (<section>
    <h2>Game Loader</h2>
    <label htmlFor="bios-load">Game: </label>
    {
      gameFile
        ? <>Loaded <button onClick={() => setGameFile(null)}>clear?</button></>
        : <input
            id="game-load"
            type="file"
            onChange={handleGameUpload}
          />
    }
    <br/>
    { gameFile && <button onClick={() => loadGame()}>Run</button>}
    <br/>
    <button onClick={() => testNoise()}>Test noise</button>
  </section>)
}