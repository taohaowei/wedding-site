<template>
  <section class="photo-section" :class="`set-${set.id}`" :data-theme="set.theme">
    <div class="head">
      <p class="badge">{{ set.badge }} · {{ set.subtitle }}</p>
      <h2 class="title">{{ set.title }}</h2>
      <p class="caption">{{ set.caption }}</p>
    </div>

    <PhotoSwiper :photos="photos" :theme="set.theme" :fallback-count="5" />

    <div class="hint">← 左右滑动查看更多 →</div>
  </section>
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
import type { PhotoSet } from '@/data/photos'
import PhotoSwiper from '@/components/PhotoSwiper.vue'
import { p } from '@/utils/path'

const props = defineProps<{ set: PhotoSet; active?: boolean }>()

// 照片清单由 vite plugin (scripts/photos-manifest-plugin.ts) 自动生成
// 维护方式:
//   1. 把图片直接放进 public/photos/<set>/ 即可自动出现(按字典序)
//   2. 想自定义顺序,在该 set 目录下建 _order.json(数组),里面没列的文件追加到末尾
// 详见各 set 目录下的 README.md
const photos = ref<string[]>([])

async function loadManifest(setId: string) {
  try {
    const res = await fetch(p(`/photos/${setId}/manifest.json`), { cache: 'no-cache' })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const list = (await res.json()) as string[]
    if (!Array.isArray(list)) throw new Error('manifest 不是数组')
    photos.value = list.map((name) => p(`/photos/${setId}/${encodeURIComponent(name)}`))
  } catch (e) {
    console.warn(`[PhotoSection] 加载 ${setId} manifest 失败,使用占位:`, e)
    photos.value = []
  }
}

onMounted(() => loadManifest(props.set.id))
watch(() => props.set.id, (id) => loadManifest(id))
</script>

<style lang="scss" scoped>
@use '@/styles/tokens.scss' as *;

// 婚纱照三屏专属样式 — 全部 scoped,绝不泄漏到其他屏
// 设计目标:
//   1. 主图占据更多屏幕高度(类 instagram 风,head/hint 极简)
//   2. 320 / 360 窄屏标题不换行、不溢出
//   3. iPad 768 控制内容最大宽度,避免拉伸变形
//   4. 港式黑白主题(data-theme='bw')仅作用于自身 PhotoSection,不污染全局

.photo-section {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  // 上下 padding 收紧,把更多空间留给主图
  padding: clamp(2.5dvh, 3.5dvh, 4.5dvh) clamp(8px, 3.2vw, 14px) clamp(1.6dvh, 2.4dvh, 3dvh);
  gap: clamp(6px, 1.4vh, 12px);
  background: linear-gradient(160deg, #FFF6EC 0%, #FAF6F0 100%);
  overflow: hidden; // 防止任何子元素意外撑开
}

.head {
  text-align: center;
  display: flex;
  flex-direction: column;
  gap: 4px;
  flex-shrink: 0;
  // 给 BgmPlayer 留位 — 仅右侧;窄屏 BgmPlayer 实际更靠边,可以适当收紧
  padding-right: clamp(40px, 13vw, 50px);
  padding-left: clamp(6px, 2vw, 10px);
  min-width: 0;
}

.badge {
  font-family: $serif-en;
  font-style: italic;
  letter-spacing: clamp(.12em, .6vw, .22em);
  color: $accent-deep;
  font-size: clamp(.62rem, 2.2vw, .78rem);
  margin: 0;
  text-transform: uppercase;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.title {
  font-family: $serif-zh;
  // 窄屏字号下探到 1rem,iPad 上限 1.7rem,避免太大导致换行/换位
  font-size: clamp(1rem, 4.6vw, 1.7rem);
  margin: 0;
  letter-spacing: clamp(.04em, .5vw, .1em);
  color: $text;
  // 关键:单行显示,空间不够时压缩字距而非换行
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  line-height: 1.25;
}

.caption {
  margin: 0;
  font-family: $serif-zh;
  color: $text-light;
  font-size: clamp(.68rem, 2.3vw, .8rem);
  letter-spacing: clamp(.06em, .6vw, .1em);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.hint {
  text-align: center;
  font-size: clamp(.6rem, 2vw, .7rem);
  color: $text-light;
  letter-spacing: .22em;
  flex-shrink: 0;
  opacity: .55;
  margin: 0;
  white-space: nowrap;
}

// === 极窄屏专项(<=360,iPhone SE / 小安卓) ===
// 进一步收紧,确保完整可见
@media (max-width: 360px) {
  .photo-section {
    padding: 2.2dvh 8px 1.4dvh;
    gap: 5px;
  }
  .head {
    gap: 2px;
    padding-right: 38px;
    padding-left: 6px;
  }
  .title {
    // 窄屏标题再小一档,字距收紧;允许 letter-spacing 为 0
    font-size: clamp(.95rem, 4.4vw, 1.1rem);
    letter-spacing: .02em;
  }
  .badge {
    font-size: .6rem;
    letter-spacing: .12em;
  }
  .caption {
    font-size: .68rem;
    letter-spacing: .04em;
  }
  .hint {
    font-size: .56rem;
    letter-spacing: .18em;
  }
}

// === 平板(768+) ===
// 内容最大宽度收敛,避免主图被拉得过宽变形
@media (min-width: 768px) {
  .photo-section {
    padding: 4dvh clamp(24px, 5vw, 56px) 3dvh;
    gap: 14px;
    // 用居中容器约束最大宽度
    align-items: center;

    & > * {
      width: 100%;
      max-width: 720px;
    }
  }
  .head {
    padding-right: 56px;
    gap: 6px;
  }
  .title {
    font-size: clamp(1.5rem, 3.2vw, 2rem);
  }
}

// 大屏 / 桌面
@media (min-width: 1280px) {
  .photo-section > * {
    max-width: 880px;
  }
}

// === 港式黑白:整屏深色(仅作用于本 section,scoped + 属性选择器双重隔离) ===
// 不影响其他屏:scoped 只编译到本组件 hash,且选择器以 .photo-section 开头
.photo-section[data-theme='bw'] {
  background: linear-gradient(160deg, #0d0d0d 0%, #1a1a1a 100%);
  .badge { color: #ddd; }
  .title { color: #fff; }
  .caption { color: #888; }
  .hint { color: #555; }
}
// 兼容旧版 set-id class(防止 theme 字段未配)
.photo-section.set-outdoor-bw {
  background: linear-gradient(160deg, #0d0d0d 0%, #1a1a1a 100%);
  .badge { color: #ddd; }
  .title { color: #fff; }
  .caption { color: #888; }
  .hint { color: #555; }
}
</style>
