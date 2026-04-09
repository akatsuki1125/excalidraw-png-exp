import { useState } from 'react'
import { loadFromBlob, exportToBlob } from '@excalidraw/excalidraw'
import './App.css'

const isFsAccessSupported = () =>
  typeof window !== 'undefined' && 'showDirectoryPicker' in window

const getStem = (filename) => filename.replace(/\.[^/.]+$/, '')
const EXPORT_SCALE = 3

async function exportSceneToPng(scene) {
  return exportToBlob({
    elements: scene.elements,
    appState: {
      ...scene.appState,
      exportBackground: true,
    },
    files: scene.files || {},
    mimeType: 'image/png',
    getDimensions: (width, height) => ({
      width: width * EXPORT_SCALE,
      height: height * EXPORT_SCALE,
      scale: EXPORT_SCALE,
    }),
  })
}

function App() {
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)

  const handleBatchConvert = async () => {
    if (!isFsAccessSupported()) {
      setMessage('このブラウザはディレクトリ選択に未対応です')
      return
    }

    setBusy(true)
    setMessage('ディレクトリを選択してください')

    try {
      const inputDirHandle = await window.showDirectoryPicker()
      const outputDirHandle = await window.showDirectoryPicker()

      let total = 0
      let converted = 0
      let skipped = 0

      for await (const entry of inputDirHandle.values()) {
        if (entry.kind !== 'file') continue
        if (!entry.name.endsWith('.excalidraw')) {
          skipped += 1
          continue
        }

        total += 1
        const file = await entry.getFile()
        const scene = await loadFromBlob(file, null, null)
        const blob = await exportSceneToPng(scene)

        const stem = getStem(entry.name)
        const outputHandle = await outputDirHandle.getFileHandle(
          `${stem}.png`,
          {
            create: true,
          }
        )
        const writable = await outputHandle.createWritable()
        await writable.write(blob)
        await writable.close()
        converted += 1
      }

      setMessage(
        `完了: 変換 ${converted} 件 / 対象 ${total} 件 (スキップ ${skipped} 件)`
      )
    } catch (error) {
      console.error(error)
      setMessage(`失敗: ${error.message}`)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div style={{ padding: 24 }}>
      <h1>Excalidraw PNG Batch</h1>
      <button onClick={handleBatchConvert} disabled={busy}>
        {busy ? '処理中...' : '入力/保存ディレクトリを選択して変換'}
      </button>
      <p>{message}</p>
      <p style={{ fontSize: 12, color: '#666' }}>
        注意: ディレクトリ選択は Chromium 系ブラウザで動作します
      </p>
    </div>
  )
}

export default App
