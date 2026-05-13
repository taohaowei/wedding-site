# photos / outdoor-bw

港式黑白套系图片目录。

## 加图 / 删图
- 直接把 `.jpg .jpeg .png .webp .gif` 文件丢进本目录,刷新浏览器即可。
- 删图同理,删完文件刷新即可。
- vite plugin (`scripts/photos-manifest-plugin.ts`) 会在 dev 启动 / build / 文件变化时,自动重新生成 `manifest.json`。

## 当前顺序
本目录已存在 `_order.json`,自定义了首屏顺序:
1. 光影对视.jpg
2. 光影对视(绝美),电影感.jpg
3. 搂肩合照.jpg
4. 霸总强吻.jpg
5. 前后走.jpg

## 调整顺序
- 编辑本目录下的 `_order.json`(JSON 数组,严格按希望显示的顺序写文件名)。
- 列在 `_order.json` 里的文件按指定顺序在前;**没列的文件按字典序追加在末尾**。
- 改完后刷新浏览器即可生效。

## 注意
- 以 `_` 或 `.` 开头的文件会被忽略(`_order.json` / `.DS_Store` 等)。
- 文件名支持中文及标点(包括全角逗号、括号),URL 编码会自动处理。
- `manifest.json` 由插件自动生成,不要手动编辑。
