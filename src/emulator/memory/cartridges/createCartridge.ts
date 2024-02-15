import { persistRtc, persistSave } from "../../../web/indexedDb/gameStore"
import { StoredGame } from "../../../web/indexedDb/storedGame"
import { Cartridge } from "./cartridge"
import { Mbc1Cartridge } from "./mbc1Cartridge"
import { Mbc3Cartridge } from "./mbc3Cartridge"
import { Mbc5Cartridge } from "./mbc5Cartridge"

// Reference: https://gbdev.io/pandocs/The_Cartridge_Header.html#0147--cartridge-type

// PKM R: 0x13 [MBC3+RAM+BATTERY]
// LA: 0x03 [MBC1+RAM+BATTERY] (DX: 1b [MBC5+RAM+BATTERY])
export async function createCartridge(game: StoredGame): Promise<Cartridge> {
  const cartridgeType = game.data[0x147]

  switch (cartridgeType) {
    case 0x00:
      return new Cartridge(game.data, persistSave(game.id), game.save)
    case 0x01:
    case 0x02:
    case 0x03:
      return new Mbc1Cartridge(game.data, persistSave(game.id), game.save)
    case 0x0f:
    case 0x10:
    case 0x11:
    case 0x12:
    case 0x13:
      return new Mbc3Cartridge(
        game.data,
        persistSave(game.id),
        game.save,
        game.rtc,
        persistRtc(game.id))
    case 0x19:
    case 0x1a:
    case 0x1b:
    case 0x1c:
    case 0x1d:
    case 0x1e:
      return new Mbc5Cartridge(game.data, persistSave(game.id), game.save)
  }

  throw new Error("Unknown cartridge type: " + cartridgeType)
}
