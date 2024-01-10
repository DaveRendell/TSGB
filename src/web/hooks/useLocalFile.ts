import * as React from "react"

export default function useLocalFile(
  key: string,
): [File | null, (newFile: File | null) => void] {
  const [stateFile, setStateFile] = React.useState<File | null>(null)

  const readFromStorage = () => {
    const base64EncodedFile = window.localStorage.getItem(key)
    if (base64EncodedFile) {
      base64Decode(base64EncodedFile).then(setStateFile)
    }
  }

  React.useEffect(() => {
    readFromStorage()
    addEventListener("storage", (event: StorageEvent) => {
      if (event.key === key) {
        readFromStorage()
      }
    })
  }, [key])

  const setValue: (newFile: File | null) => void = (newFile) => {
    if (newFile === null) {
      setStateFile(null)
      window.localStorage.removeItem(key)
      return
    }
    base64Encode(newFile).then((encodedFile) => {
      window.localStorage.setItem(key, encodedFile)
      readFromStorage()
    })
  }

  return [stateFile, setValue]
}

function base64Encode(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      resolve(reader.result?.toString() || "")
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

async function base64Decode(base64: string): Promise<File> {
  const res: Response = await fetch(base64)
  const blob: Blob = await res.blob()
  return new File([blob], "image.png", { type: "image/png" })
}
