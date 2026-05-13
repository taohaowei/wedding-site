// 故事屏(屏 2-6)文案
export interface StoryItem {
  id: 'meet' | 'one-km' | 'sincere' | 'five-years' | 'decision'
  index: number
  badge: string
  title: string
  paragraphs: string[]
  illustration: string
}

export const stories: StoryItem[] = [
  {
    id: 'meet',
    index: 1,
    badge: '故事 ①',
    title: '相 · 亲',
    paragraphs: [
      '2020 年的某一天 ——',
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
    paragraphs: [
      '点开对方资料的那一刻才发现:',
      '在偌大的杭州,',
      '我们 —— 只相隔一公里。'
    ],
    illustration: '/illustrations/scene-02-one-km.png'
  },
  {
    id: 'sincere',
    index: 3,
    badge: '故事 ③',
    title: '真 · 诚',
    paragraphs: [
      '第一次见面,',
      '没有刻意的浪漫,',
      '只是看见了彼此眼里的真诚。',
      '那一刻就决定:是你了。'
    ],
    illustration: '/illustrations/scene-03-sincere.png'
  },
  {
    id: 'five-years',
    index: 4,
    badge: '故事 ④',
    title: '五 · 年',
    paragraphs: [
      '五年了。',
      '有过争吵,有过分歧,',
      '有过深夜的眼泪,也有清晨的拥抱。',
      '我们 —— 还是走到了今天。'
    ],
    illustration: '/illustrations/scene-04-five-years.png'
  },
  {
    id: 'decision',
    index: 5,
    badge: '故事 ⑤',
    title: '决 · 定',
    paragraphs: [
      '我们决定 ——',
      '把这场不期而遇的赴约,',
      '变成一辈子的承诺。'
    ],
    illustration: '/illustrations/scene-05-decision.png'
  }
]
