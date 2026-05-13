# photos / french

法式套系图片目录。

## 加图 / 删图
- 直接把 `.jpg .jpeg .png .webp .gif` 文件丢进本目录,刷新浏览器即可。
- 删图同理,删完文件刷新即可。
- vite plugin (`scripts/photos-manifest-plugin.ts`) 会在 dev 启动 / build / 文件变化时,自动重新生成 `manifest.json`。

## 调整顺序
- 默认按文件名字典序排列。
- 想自定义顺序,在本目录新建 `_order.json`,内容是文件名数组,例如:
  ```json
  ["女单,温婉.jpg", "合照,正式.jpg"]
  ```
- 列在 `_order.json` 里的文件按指定顺序在前;**没列的文件按字典序追加在末尾**。
- 改完 `_order.json` 后刷新浏览器即可。

## 注意
- 以 `_` 或 `.` 开头的文件会被忽略(`_order.json` / `.DS_Store` 等)。
- 文件名支持中文及标点(包括全角逗号、括号),URL 编码会自动处理。
- `manifest.json` 由插件自动生成,不要手动编辑。
