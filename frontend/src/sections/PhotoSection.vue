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

const props = defineProps<{ set: PhotoSet; active?: boolean }>()

// 照片清单由 vite plugin (scripts/photos-manifest-plugin.ts) 自动生成
// 维护方式:
//   1. 把图片直接放进 public/photos/<set>/ 即可自动出现(按字典序)
//   2. 想自定义顺序,在该 set 目录下建 _order.json(数组),里面没列的文件追加到末尾
// 详见各 set 目录下的 README.md
const photos = ref<string[]>([])

async function loadManifest(setId: string) {
  try {
    const res = await fetch(`/photos/${setId}/manifest.json`, { cache: 'no-cache' })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const list = (await res.json()) as string[]
    if (!Array.isArray(list)) throw new Error('manifest 不是数组')
    photos.value = list.map((name) => `/photos/${setId}/${encodeURIComponent(name)}`)
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

.photo-section {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  padding: 6dvh 16px 4dvh 16px;
  gap: 16px;
  background: linear-gradient(160deg, #FFF6EC 0%, #FAF6F0 100%);
}

.head {
  text-align: center;
  display: flex;
  flex-direction: column;
  gap: 6px;
  flex-shrink: 0;
}

.badge {
  font-family: $serif-en;
  font-style: italic;
  letter-spacing: .25em;
  color: $accent-deep;
  font-size: .8rem;
  margin: 0;
  text-transform: uppercase;
}

.title {
  font-family: $serif-zh;
  font-size: clamp(1.4rem, 5.5vw, 1.9rem);
  margin: 0;
  letter-spacing: .12em;
  color: $text;
}

.caption {
  margin: 0;
  font-family: $serif-zh;
  color: $text-light;
  font-size: .82rem;
  letter-spacing: .12em;
}

.hint {
  text-align: center;
  font-size: .72rem;
  color: $text-light;
  letter-spacing: .25em;
  flex-shrink: 0;
  opacity: .6;
}

// 港式黑白:整屏深色
.photo-section[data-theme='bw'],
.photo-section.set-outdoor-bw {
  background: linear-gradient(160deg, #0d0d0d 0%, #1a1a1a 100%);
  .badge { color: #ddd; }
  .title { color: #fff; }
  .caption { color: #888; }
  .hint { color: #555; }
}
</style>
