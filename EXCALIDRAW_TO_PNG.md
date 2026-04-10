# Excalidraw(.excalidraw) → PNG 変換の方法（App.jsx）

このプロジェクトでは、`/Users/akatsuki/projects/excalidraw_test/excalidraw-png-exp/src/App.jsx` 内で
`.excalidraw` ファイルを PNG に変換しています。

## 変換の全体像
1. 入力ディレクトリと保存ディレクトリを選択する
2. 入力ディレクトリ内の `.excalidraw` を順に読み込む
3. `loadFromBlob` で **scene**（図面データ）に変換する
4. `exportToBlob` で PNG の **Blob** を生成する
5. 保存ディレクトリに **同名(stem)の PNG** として書き出す

## 使っている公式 API
- `loadFromBlob`（`@excalidraw/excalidraw`）
  - `.excalidraw` ファイルを **scene** に変換する
- `exportToBlob`（`@excalidraw/excalidraw`）
  - scene を PNG の **Blob** に変換する

## 実装のポイント
### 1) ディレクトリ選択
ブラウザの File System Access API を使って、入力と保存ディレクトリを選びます。

```js
const inputDirHandle = await window.showDirectoryPicker()
const outputDirHandle = await window.showDirectoryPicker()
```

### 2) `.excalidraw` の読み込み
`.excalidraw` のみ対象にして読み込みます。

```js
const file = await entry.getFile()
const scene = await loadFromBlob(file, null, null)
```

### 3) PNG への変換
`exportToBlob` により PNG の Blob を生成します。
解像度は `EXPORT_SCALE` で倍率指定しています（現在は 3 倍）。

```js
const blob = await exportToBlob({
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
```

### 4) PNG の保存
出力先に **同名の PNG** を作成して書き込みます。

```js
const outputHandle = await outputDirHandle.getFileHandle(`${stem}.png`, {
  create: true,
})
const writable = await outputHandle.createWritable()
await writable.write(blob)
await writable.close()
```

## 注意点
- `showDirectoryPicker` を使うため、**Chromium 系ブラウザ（Chrome/Edge/Brave）** が必要です。
- `@excalidraw/excalidraw` は **ブラウザ前提のライブラリ** なので、Node 単体CLIでは動きません。

## 関連ファイル
- `/Users/akatsuki/projects/excalidraw_test/excalidraw-png-exp/src/App.jsx`
- `/Users/akatsuki/projects/excalidraw_test/excalidraw-png-exp/src/main.jsx`
- `/Users/akatsuki/projects/excalidraw_test/excalidraw-png-exp/index.html`
