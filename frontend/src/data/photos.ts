// 婚纱照三套(屏 7-9)
export interface PhotoSet {
  id: 'main-gown' | 'french' | 'outdoor-bw'
  index: number
  badge: string
  title: string
  subtitle: string
  caption: string
  theme?: 'light' | 'bw'
  // 用 import.meta.glob 自动收图,在 PhotoSection 里实现
}

export const photoSets: PhotoSet[] = [
  {
    id: 'main-gown',
    index: 1,
    badge: 'Set 01',
    title: '主纱 · The White Vow',
    subtitle: 'White & Vow',
    caption: '白纱,长裙,与你共度的诺言。',
    theme: 'light'
  },
  {
    id: 'french',
    index: 2,
    badge: 'Set 02',
    title: '法式 · Café d\'Été',
    subtitle: 'Café d\'Été',
    caption: '夏日,咖啡,和缓缓发酵的浪漫。',
    theme: 'light'
  },
  {
    id: 'outdoor-bw',
    index: 3,
    badge: 'Set 03',
    title: '港式黑白 · Stay Cool, Stay Real',
    subtitle: 'Stay Cool · Stay Real',
    caption: '黑白胶片质感,留住最真实的我们。',
    theme: 'bw'
  }
]
