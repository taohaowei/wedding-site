// 故事屏(屏 2-6)文案
// 5 屏故事,每屏带一个时间节点(用作时间主题角标 + subtitle)
export interface StoryItem {
  id: 'meet' | 'one-km' | 'sincere' | 'engagement' | 'decision'
  index: number
  badge: string
  title: string
  subtitle?: string // 通常是日期,如 2021.10.16
  date?: string // 角标用的"时间戳"日期(原文样式),为空则不渲染角标
  paragraphs: string[]
  illustration: string
  bgPhoto?: string // 全屏背景照片(用于订婚屏)
}

export const stories: StoryItem[] = [
  {
    id: 'meet',
    index: 1,
    badge: '故事 ①',
    title: '相 · 亲',
    subtitle: '2021.10.16',
    date: '2021.10.16',
    paragraphs: [
      '那一天 ——',
      '我们各自,在网络上,',
      '认认真真地写下了一段相亲帖。'
    ],
    illustration: '/illustrations/scene-01-blind-date.png'
  },
  {
    id: 'one-km',
    index: 2,
    badge: '故事 ②',
    title: '一 · 公 · 里',
    subtitle: '2021.10.31',
    date: '2021.10.31',
    paragraphs: [
      '在偌大的杭州,',
      '我们 —— 只相隔一公里。',
      '那一天,我们在一起了。'
    ],
    illustration: '/illustrations/scene-02-one-km.png'
  },
  {
    id: 'sincere',
    index: 3,
    badge: '故事 ③',
    title: '真 · 诚',
    subtitle: '那一刻',
    date: '那一刻',
    paragraphs: [
      '第一次见面,',
      '没有刻意的浪漫,',
      '只是看见了彼此眼里的真诚。',
      '那一刻就决定:是你了。'
    ],
    illustration: '/illustrations/scene-03-sincere.png',
    bgPhoto: '/illustrations/scene-03-sincere.png'
  },
  {
    id: 'engagement',
    index: 4,
    badge: '故事 ④',
    title: '订 · 婚',
    subtitle: '2025.01.18',
    date: '2025.01.18',
    paragraphs: [
      '四年后的冬天 ——',
      '在见证人面前,',
      '我们郑重地说了「我愿意」。'
    ],
    // 订婚屏使用横滑 PhotoSwiper(同婚纱照),illustration 字段保留作 fallback
    illustration: '/photos/engagement/合照-我们订婚啦（首页）.jpg'
  },
  {
    id: 'decision',
    index: 5,
    badge: '故事 ⑤',
    title: '今 · 天',
    subtitle: '2026.06.13',
    date: '2026.06.13',
    paragraphs: [
      '我们决定 ——',
      '把这场不期而遇的赴约,',
      '变成一辈子的承诺。',
      '今天,我们结婚了 💍'
    ],
    illustration: '/illustrations/scene-05-decision.png'
  }
]
