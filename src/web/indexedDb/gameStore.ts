import { StoredGame } from "./storedGame"

export async function getGameList(): Promise<StoredGame[]> {
  const db = await openDb()
  const transaction = db.transaction("games", "readonly")
  const store = transaction.objectStore("games")

  return new Promise((resolve, reject) => {
    const request = store.getAll()
    request.onerror = reject
    request.onsuccess = () => {
      resolve(request.result as StoredGame[])
    }
  })
}

async function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = window.indexedDB.open("Games", 1)
    request.onerror = reject
    request.onupgradeneeded = () => {
      const db = request.result
      // Initialise DB
      if (!db.objectStoreNames.contains("games")) {
        db.createObjectStore("games", { keyPath: "id", autoIncrement: true })
      }
    }
    request.onsuccess = () => {
      resolve(request.result)
    }
  })
}

export async function addGame(file: File): Promise<void> {
  const title = file.name
  const data = new Uint8Array(await file.arrayBuffer())
  const storedGame: Omit<StoredGame, "id"> = { data, title }
  const db = await openDb()
  const transaction = db.transaction(["games"], "readwrite")

  const store = transaction.objectStore("games")

  return new Promise((resolve, reject) => {
    const request = store.add(storedGame)
    request.onerror = reject
    request.onsuccess = () => resolve()
  })
}

export async function deleteGame(key: number): Promise<void> {
  const db = await openDb()
  const transaction = db.transaction(["games"], "readwrite")

  const store = transaction.objectStore("games")

  return new Promise((resolve, reject) => {
    const request = store.delete(key)
    request.onerror = reject
    request.onsuccess = () => resolve()
  })
}

export const persistSave =
  (gameId: number) =>
  async (data: Uint8Array): Promise<void> => {
    const db = await openDb()
    const transaction = db.transaction(["games"], "readwrite")

    const store = transaction.objectStore("games")

    const game = await new Promise<StoredGame>((resolve, reject) => {
      const request = store.get(gameId)
      request.onerror = reject
      request.onsuccess = () => {
        resolve(request.result as StoredGame)
      }
    })

    game.save = data

    return new Promise((resolve, reject) => {
      const request = store.put(game)
      request.onerror = reject
      request.onsuccess = () => resolve()
    })
  }
