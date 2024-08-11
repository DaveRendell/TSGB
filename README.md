# TSGB

Game Boy and Game Boy Color emulator written in TypeScript.

## Features

- Launches a wide variety of original Game Boy and Game Boy Color games, though wider testing and but reporting appreciated.
- Input methods: Keyboard, onscreen buttons, and gamepad.
- Support for Game Boy Printer output (WIP).
- Limited Super Game Boy support (WIP)
- Debugging tools: view tiles, maps, sprites, palettes, memory viewer, breakpoints.

## Development status

Largely feature complete. Still to work on:

- Audio largely working: stereo panning not yet supported and noise channel resets when changing width.
- Game Boy Color backwards compatibility for Game Boy games.
- Serial port support:
  - Printer output supported
  - Specialised support for certain games pending, e.g. Tetris and Pokémon Generation I
- Super Game Boy support: Some colour palette support, no support for borders yet.

## Browser support

Most testing has taken place on Firefox on Windows and Android. From brief testing Chrome on PC appears to have better performance than Firefox, but on Android Firefox is much faster while Chrome is unplayable.
