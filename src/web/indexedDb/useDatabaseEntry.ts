import * as React from "react"
import Async, { PENDING } from "./types"

interface Entry<Model> {
  value: Model
  update(newValue: Model): Promise<void>
  delete(): Promise<void>
}
export default function useDatabaseEntry<Model>(
  id: number,
  database: IDBDatabase,
  modelName: string,
  mapper: (raw: any) => Model = (raw) => raw as Model,
  initial: Model | undefined
): Async<Entry<Model>> {
  const [value, setValue] = React.useState<Model | undefined>(initial)
  const [error, setError] = React.useState<Error | undefined>(undefined)


  const fetch = async () => {
    const transaction = database.transaction(modelName, "readonly")
    const objectStore = transaction.objectStore(modelName)

    const request = objectStore.get(id)

    request.onerror = () => {
      setError(request.error)
    }

    request.onsuccess = () => {
      try {
        setValue(mapper(request.result))
      } catch (e) {
        setError(e)
      }
      transaction.commit()
    }
  }
  const update = async () => {}
  const deleteEntry = async () => {}

  React.useEffect(() => {
    fetch()
  }, [id, database, modelName])

  if (error !== undefined) {
    return { status: "failed", error }
  }

  if (value !== undefined) {
    return {
      status: "done",
      result: {
        value,
        update,
        delete: deleteEntry
      }
    }
  }

  if (value === undefined) {
    return PENDING
  }
}
