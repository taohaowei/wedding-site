// 一次性生成 SVG path 数据，输出到 src/components/geoPaths.generated.ts
// 使用 d3-geo 把 GeoJSON 投影到 100x100 viewBox，避免运行时引入 d3-geo
import { geoIdentity, geoPath } from 'd3-geo'
import { readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = resolve(__dirname, '..')

const hz = JSON.parse(readFileSync(resolve(root, 'src/assets/hangzhou.geo.json'), 'utf-8'))
const xs = JSON.parse(readFileSync(resolve(root, 'src/assets/xiaoshan.geo.json'), 'utf-8'))

// ===== 投影 1：杭州市全图，落在 [5,5] - [95,95] 的 SVG 框里 =====
// 用 geoIdentity + reflectY(true) 而非 geoMercator，避免 d3-geo 的"剪裁伪轨迹"
// (Mercator 在小范围内的形变可忽略，identity 投影更干净)
const projHz = geoIdentity().reflectY(true).fitExtent([[5, 5], [95, 95]], hz)
const pathHz = geoPath(projHz)

const districts = hz.features.map((f) => ({
  adcode: f.properties.adcode,
  name: f.properties.name,
  d: pathHz(f),
  // 区中心在 SVG 内的坐标
  center: projHz(f.properties.center),
}))

// ===== 投影 2：萧山区单独放大，落在 [10,10] - [90,90] 的 SVG 框里 =====
const projXs = geoIdentity().reflectY(true).fitExtent([[10, 10], [90, 90]], xs)
const pathXs = geoPath(projXs)
const xsPath = pathXs(xs)

// 构造文件
const content = `// 自动生成 - 由 scripts/gen-geo-paths.mjs 产出。请勿手改。
// 数据源: DataV.GeoAtlas (https://datav.aliyun.com)

export interface GeoDistrict {
  adcode: number
  name: string
  d: string
  center: [number, number]
}

// 杭州市 13 个区/县/市，已投影到 100x100 SVG viewBox
export const hangzhouDistricts: GeoDistrict[] = ${JSON.stringify(districts, null, 2)}

// 萧山区单独图，已投影到 100x100 SVG viewBox
export const xiaoshanPath: string = ${JSON.stringify(xsPath)}

// 萧山区中心在【杭州市图】SVG 中的位置
export const xiaoshanCenterInHangzhou: [number, number] = ${JSON.stringify(
  districts.find((d) => d.adcode === 330109).center
)}
`

const outPath = resolve(root, 'src/components/geoPaths.generated.ts')
writeFileSync(outPath, content, 'utf-8')
console.log('Generated:', outPath)
console.log('Districts:', districts.length)
console.log('Xiaoshan path length:', xsPath.length)
console.log('Xiaoshan center in Hangzhou SVG:', districts.find((d) => d.adcode === 330109).center)
