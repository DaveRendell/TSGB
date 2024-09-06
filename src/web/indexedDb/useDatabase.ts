import * as React from "react"
import Async, { PENDING } from "./types"


export default function useDatabase(
  databaseName: string,
  initialise: (database: IDBDatabase) => void,
  version: number = 1
): Async<IDBDatabase> {
  const [database, setDatabase] = React.useState<Async<IDBDatabase>>(PENDING)

  React.useEffect(() => {
    const request = window.indexedDB.open(databaseName, version)

    request.onupgradeneeded = () => {
      initialise(request.result)
    }

    request.onerror = () => {
      console.error(request.error)
      setDatabase({
        status: "failed",
        error: new Error(
          `Unable to open database ${databaseName} version ${version}`)
      })
    }

    request.onsuccess = () => {
      setDatabase({
        status: "done",
        result: request.result
      })
    }
  }, [databaseName])

  return database
}