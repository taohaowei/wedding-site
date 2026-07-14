import fs from 'node:fs'
import path from 'node:path'
import type { Plugin, ViteDevServer } from 'vite'

// 受支持的图片后缀(大小写不敏感)
const IMAGE_EXTS = new Set(['.jpg', '.jpeg', '.png', '.webp', '.gif'])

// 默认要扫描的 set 子目录(在 public/photos/ 下)
const DEFAULT_SETS = ['main-gown', 'french', 'outdoor-bw']

interface PluginOptions {
  /** public 目录(绝对路径) */
  publicDir?: string
  /** 要扫描的 set 名称列表;不传则用 DEFAULT_SETS */
  sets?: string[]
  /** photos 子目录名,默认 'photos' */
  photosDir?: string
}

/**
 * 扫描 setDir,生成排序后的图片文件名数组,并写入 manifest.json
 *
 * 规则:
 * - 跳过以 _ 或 . 开头的文件(_order.json / .DS_Store 等)
 * - 只收 IMAGE_EXTS 中的扩展名
 * - 若存在 _order.json(数组),按它指定的顺序排;未列出的文件追加在末尾(字典序)
 * - 若不存在 _order.json,按字典序排
 */
function generateManifest(setDir: string): string[] | null {
  if (!fs.existsSync(setDir) || !fs.statSync(setDir).isDirectory()) {
    return null
  }

  // 1. 收集合法图片文件(跳过隐藏 / 下划线开头 / 非图片)
  const allFiles = fs.readdirSync(setDir)
  const photoFiles = allFiles.filter((name) => {
    if (name.startsWith('_') || name.startsWith('.')) return false
    const ext = path.extname(name).toLowerCase()
    if (!IMAGE_EXTS.has(ext)) return false
    // 必须是文件,不能是子目录
    const full = path.join(setDir, name)
    try {
      return fs.statSync(full).isFile()
    } catch {
      return false
    }
  })

  // 2. 读取 _order.json(可选)
  const orderPath = path.join(setDir, '_order.json')
  let order: string[] = []
  if (fs.existsSync(orderPath)) {
    try {
      const raw = fs.readFileSync(orderPath, 'utf-8')
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed)) {
        order = parsed.filter((x): x is string => typeof x === 'string')
      } else {
        console.warn(`[photos-manifest] ${orderPath} 不是数组,忽略`)
      }
    } catch (e) {
      console.warn(`[photos-manifest] 解析 ${orderPath} 失败:`, (e as Error).message)
    }
  }

  // 3. 排序:_order.json 中列出的优先,其余按字典序追加
  const photoSet = new Set(photoFiles)
  const ordered: string[] = []
  const seen = new Set<string>()

  for (const name of order) {
    if (photoSet.has(name) && !seen.has(name)) {
      ordered.push(name)
      seen.add(name)
    } else if (!photoSet.has(name)) {
      // _order.json 里写了但实际文件不存在,警告但不中断
      console.warn(`[photos-manifest] ${path.basename(setDir)}/_order.json 列出 "${name}" 但文件不存在`)
    }
  }

  const remaining = photoFiles
    .filter((n) => !seen.has(n))
    .sort((a, b) => a.localeCompare(b, 'zh-Hans-CN'))

  return [...ordered, ...remaining]
}

/** 将 manifest 写入到 setDir/manifest.json,只在内容变化时写,避免触发额外 HMR */
function writeManifestIfChanged(setDir: string, manifest: string[]): boolean {
  const out = path.join(setDir, 'manifest.json')
  const content = JSON.stringify(manifest, null, 2) + '\n'
  if (fs.existsSync(out)) {
    const old = fs.readFileSync(out, 'utf-8')
    if (old === content) return false
  }
  fs.writeFileSync(out, content, 'utf-8')
  return true
}

/** 为单个 set 生成并写入 manifest;返回是否有变更 */
function regenerateSet(photosRoot: string, setName: string): boolean {
  const setDir = path.join(photosRoot, setName)
  const manifest = generateManifest(setDir)
  if (manifest === null) {
    console.warn(`[photos-manifest] 跳过不存在的目录: ${setDir}`)
    return false
  }
  const changed = writeManifestIfChanged(setDir, manifest)
  if (changed) {
    console.log(`[photos-manifest] 更新 ${setName}/manifest.json (${manifest.length} 张)`)
  }
  return changed
}

/** 为所有 set 生成 manifest */
function regenerateAll(photosRoot: string, sets: string[]): void {
  const finalSets = sets.length > 0 ? sets : discoverSets(photosRoot)
  for (const s of finalSets) {
    regenerateSet(photosRoot, s)
  }
}

/** 自动扫描 photosRoot 下所有子目录(跳过 _ 和 . 开头) */
function discoverSets(photosRoot: string): string[] {
  if (!fs.existsSync(photosRoot)) return []
  return fs.readdirSync(photosRoot).filter((name) => {
    if (name.startsWith('_') || name.startsWith('.')) return false
    try {
      return fs.statSync(path.join(photosRoot, name)).isDirectory()
    } catch {
      return false
    }
  })
}

export default function photosManifestPlugin(options: PluginOptions = {}): Plugin {
  const sets = options.sets ?? DEFAULT_SETS
  const photosDir = options.photosDir ?? 'photos'
  let photosRoot = ''

  return {
    name: 'photos-manifest',

    configResolved(config) {
      const publicDir = options.publicDir ?? config.publicDir
      photosRoot = path.join(publicDir, photosDir)
    },

    // 构建前生成一次
    buildStart() {
      if (!photosRoot) return
      regenerateAll(photosRoot, sets)
    },

    // dev 模式:启动时生成一次,并 watch 文件变化
    configureServer(server: ViteDevServer) {
      if (!photosRoot) return
      regenerateAll(photosRoot, sets)

      // 监听 public/photos 下的变化(新增/删除/_order.json 改动)
      // chokidar 是 vite 内置依赖,通过 server.watcher 暴露
      const watcher = server.watcher
      // 把 photos 根目录加入 watch(默认 vite 不一定 watch public)
      watcher.add(photosRoot)

      const onChange = (filePath: string) => {
        // 只处理在 photosRoot 下的文件
        const rel = path.relative(photosRoot, filePath)
        if (rel.startsWith('..') || path.isAbsolute(rel)) return

        // 找到属于哪个 set
        const segs = rel.split(path.sep)
        if (segs.length < 2) return
        const setName = segs[0]
        // 自动扫描模式(sets 为空)→ 接受任意非 _/. 开头的子目录
        // 显式 sets 模式 → 仅接受列表中的
        if (sets.length > 0 && !sets.includes(setName)) return
        if (setName.startsWith('_') || setName.startsWith('.')) return

        const filename = segs[segs.length - 1]
        // 跳过 manifest.json 自身的变更,避免无限循环
        if (filename === 'manifest.json') return

        regenerateSet(photosRoot, setName)
      }

      watcher.on('add', onChange)
      watcher.on('unlink', onChange)
      watcher.on('change', onChange)
    }
  }
}
