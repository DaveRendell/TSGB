import * as React from "react"
import AudioProcessor from "../../../emulator/audio/audioProcessor"

interface Props {
  audioProcessor: AudioProcessor
}

export function AudioControl({ audioProcessor }: Props) {
  const [isMuted, setIsMuted] = React.useState(audioProcessor.isMuted)
  const [volume, setVolume] = React.useState(1.0)

  const toggleMute = () => {
    audioProcessor.isMuted = !audioProcessor.isMuted
    setIsMuted(audioProcessor.isMuted)
    if (audioProcessor.isMuted) {
      audioProcessor.emulatorAudioControl.gain.setValueAtTime(
        0,
        audioProcessor.audioContext.currentTime
      )
    } else {
      audioProcessor.emulatorAudioControl.gain.setValueAtTime(
        volume,
        audioProcessor.audioContext.currentTime
      )
    }
  }

  const updateVolume = (e: React.ChangeEvent<HTMLInputElement>) => {
    setVolume(parseFloat(e.target.value))
    if (!audioProcessor.isMuted) {
      audioProcessor.emulatorAudioControl.gain.setValueAtTime(
        volume,
        audioProcessor.audioContext.currentTime
      )
    }
  }

  return (<div>
    <h3>Audio</h3>
    <label htmlFor="mute">Mute</label>
    <input
      type="checkbox"
      id="mute"
      name="mute"
      checked={isMuted}
      onChange={() => toggleMute()}
    /><br/>
    <label htmlFor="volume">Volume</label>
    <input
      type="range"
      id="volume"
      name="volume"
      min="0"
      max="2"
      step="0.05"
      value={volume}
      onChange={updateVolume}
    />
  </div>)
}