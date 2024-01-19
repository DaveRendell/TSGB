# TSGB

Game Boy emulator written in TypeScript (WIP)

## Browser support

Most testing has taken place on Firefox on Windows and Android. From brief testing Chrome on PC appears to have better performance than Firefox, but on Android Firefox is much faster while Chrome is unplayable.

## Status

### CPU

Largely working, still some edge cases being picked up by Blargg test roms that need addressing. 

### Graphics

Monochrome rendering is fully implemented.

Future improvements:
- Move rendering code to a worker thread to improve performance
- GBC support

### Audio

Audio is mostly implemented, with some features still to be implemented

Still to implement:
- Duty cycles
- Panning
- Noise cycle width switching - currently switching width resets the stream

### Input

Games can be controlled in three ways: Keyboard input, Gamepad support, and on screen buttons.

The bindings for the keyboard are: A -> Z, B -> X, Start -> Enter, Select -> Backspace, D-Pad -> Arrow keys

Still to implement: input re-mapping

### Cartridge support

Currently boots MBC1, MBC3, and MBC5 ROMs. MBC1 is fairly comprehensively tested, the others may still need a bit more work. RTC support is not yet implemented for MBC3.


