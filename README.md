# TSGB
Game Boy emulator written in TypeScript (WIP)

## Status

### Graphics
- Background layer : renders, only first tileset supported
- Window layer: TODO
- Sprite layer: TODO
- LCD control: TODO

### Audio
- Pulse channels (1 & 2): Mostly implemented, no frequency sweep or duty cycle support
- Waveform channel: TODO
- Noise channel: TODO
- Master audio control: TODO

### Controller support
TODO

### CPU
_Most_ Blaarg cpu instruction test ROMs pass - interrupts doesn't yet. VBlank is implemented, and HBlank and timer.

### Cartridge support
Currently only supports non MBC ROMs (e.g. Tetris)
