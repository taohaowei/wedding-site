<template>
  <div class="guide-page">
    <!-- 顶部装饰条 -->
    <div class="topbar"></div>

    <!-- BGM(同邀请函) -->
    <BgmPlayer src="/audio/bgm.mp3" />

    <!-- 返回按钮(左上,避开右上 BGM 按钮) -->
    <RouterLink to="/" class="back-btn" aria-label="回到邀请函首页">
      <span class="arrow">←</span>
      <span class="t">回邀请函</span>
    </RouterLink>

    <main class="content">
      <!-- 标题 -->
      <header class="head">
        <p class="kicker">FOR OUR DEAREST GUESTS</p>
        <h1 class="title">景 德 镇 一 日 攻 略</h1>
        <p class="sub">瓷都 · 逛 · 买 · 吃 — 婚礼前后,顺便玩</p>
        <p class="meta">📍 江西景德镇 · 推荐时间:6.12 或 6.14</p>
      </header>

      <!-- 开场卡 -->
      <section class="intro card">
        <p>婚礼是 <b>6.13(周六)</b> · 在乐平。乐平到景德镇市区 <b>~ 40 分钟</b>,非常近。</p>
        <p>挑你方便的:</p>
        <ul class="time-list">
          <li class="rec"><b>6.13 晚上</b>(婚礼后)— ⭐ 推荐:过去赶上<b>夜市</b>,先逛一波,第二天玩得更充裕</li>
          <li><b>6.14</b>(婚礼后一天)— 不赶时间慢慢逛</li>
        </ul>
        <p class="tag-line">主题就 3 个字:<span class="hi">逛</span> · <span class="hi">买</span> · <span class="hi">吃</span></p>
        <p class="caption">这是景德镇最让人回家"晒一晒"的部分 ✨</p>
      </section>

      <!-- 住宿 + 景点位置(合一) -->
      <section class="block">
        <h2><span class="ic">🏨</span> 住宿 · 选陶溪川附近就对了</h2>
        <p class="reason"><b>为什么选陶溪川?</b>它是这趟最理想的基地 — <b>5 km 内能覆盖 4 个核心景点</b>,租电瓶车 15 分钟全到。</p>
        <ul class="list">
          <li><b>快捷连锁</b> — 汉庭/全季/亚朵 等 <span class="price">¥150–300</span></li>
          <li><b>特色酒店</b> — 陶溪川凯悦嘉轩(Hyatt Place,瓷器主题大堂) <span class="price">¥500–700</span></li>
        </ul>
        <div class="map-card">
          <svg viewBox="0 0 600 460" class="map-svg" xmlns="http://www.w3.org/2000/svg" aria-label="景德镇核心景点位置示意图">
            <defs>
              <radialGradient id="mapBg" cx="50%" cy="45%" r="60%">
                <stop offset="0%" stop-color="#FFEEDC"/>
                <stop offset="60%" stop-color="#FAF6F0"/>
                <stop offset="100%" stop-color="#F4E8D6"/>
              </radialGradient>
              <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M40 0H0V40" fill="none" stroke="rgba(110,92,142,.08)" stroke-width="1"/>
              </pattern>
              <radialGradient id="dotMain" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stop-color="#F5A572"/>
                <stop offset="100%" stop-color="#E58955"/>
              </radialGradient>
              <radialGradient id="dotSat" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stop-color="#F4C4C4"/>
                <stop offset="100%" stop-color="#C77B7B"/>
              </radialGradient>
            </defs>

            <rect width="600" height="460" fill="url(#mapBg)"/>
            <rect width="600" height="460" fill="url(#grid)"/>

            <path d="M 30 80 Q 200 60, 280 200 T 340 380 T 560 440" fill="none" stroke="rgba(110,160,200,.25)" stroke-width="14" stroke-linecap="round"/>
            <text x="50" y="78" font-family="serif" font-style="italic" font-size="13" fill="#7896B0">昌 江</text>

            <g stroke="rgba(245,165,114,.4)" stroke-width="1.4" stroke-dasharray="3 4" fill="none">
              <line x1="300" y1="230" x2="380" y2="100"/>
              <line x1="300" y1="230" x2="500" y2="280"/>
              <line x1="300" y1="230" x2="220" y2="370"/>
              <line x1="300" y1="230" x2="160" y2="180"/>
              <line x1="300" y1="230" x2="200" y2="90"/>
            </g>

            <g>
              <circle cx="300" cy="230" r="36" fill="url(#dotMain)" opacity="0.18"/>
              <circle cx="300" cy="230" r="20" fill="url(#dotMain)"/>
              <circle cx="300" cy="230" r="6" fill="#fff"/>
              <text x="300" y="270" text-anchor="middle" font-family="serif" font-size="15" font-weight="600" fill="#2D2118">陶 溪 川</text>
              <text x="300" y="288" text-anchor="middle" font-family="serif" font-style="italic" font-size="10" fill="#E58955">YOU ARE HERE</text>
            </g>

            <g>
              <circle cx="200" cy="90" r="10" fill="url(#dotSat)"/>
              <text x="200" y="74" text-anchor="middle" font-family="serif" font-size="13" fill="#2D2118">陶瓷博物馆</text>
              <text x="200" y="58" text-anchor="middle" font-family="serif" font-style="italic" font-size="10" fill="#888">~ 5 km</text>
            </g>

            <g>
              <circle cx="380" cy="100" r="10" fill="url(#dotSat)"/>
              <text x="380" y="84" text-anchor="middle" font-family="serif" font-size="13" fill="#2D2118">雕塑瓷厂</text>
              <text x="380" y="68" text-anchor="middle" font-family="serif" font-style="italic" font-size="10" fill="#888">~ 3 km</text>
            </g>

            <g>
              <circle cx="500" cy="280" r="10" fill="url(#dotSat)"/>
              <text x="500" y="266" text-anchor="middle" font-family="serif" font-size="13" fill="#2D2118">陶阳新村</text>
              <text x="500" y="304" text-anchor="middle" font-family="serif" font-style="italic" font-size="10" fill="#888">~ 3 km · 夜市</text>
            </g>

            <g>
              <circle cx="160" cy="180" r="10" fill="url(#dotSat)"/>
              <text x="160" y="164" text-anchor="middle" font-family="serif" font-size="13" fill="#2D2118">御窑博物馆</text>
              <text x="160" y="148" text-anchor="middle" font-family="serif" font-style="italic" font-size="10" fill="#888">~ 4 km · 陶阳里</text>
            </g>

            <g>
              <circle cx="220" cy="370" r="9" fill="url(#dotSat)" opacity="0.6"/>
              <text x="220" y="392" text-anchor="middle" font-family="serif" font-size="12" fill="#888">三宝村(陶艺村)</text>
              <text x="220" y="408" text-anchor="middle" font-family="serif" font-style="italic" font-size="10" fill="#aaa">~ 8 km · 偏远</text>
            </g>

            <g transform="translate(550 50)">
              <circle r="22" fill="rgba(255,255,255,.7)" stroke="rgba(110,92,142,.3)" stroke-width="1"/>
              <path d="M 0,-14 L -7,8 L 0,3 L 7,8 Z" fill="#E58955"/>
              <text y="-25" text-anchor="middle" font-family="serif" font-size="11" fill="#6E5C8E" font-weight="600">N</text>
            </g>
          </svg>
        </div>
      </section>

      <!-- 逛 + 买 -->
      <section class="block">
        <h2><span class="ic">🛍️</span> 逛 + 买 三大圣地</h2>

        <article class="poi">
          <div class="poi-rank">01</div>
          <div class="poi-body">
            <h3>陶溪川文创集市 <span class="stars">⭐️⭐️⭐️⭐️⭐️</span></h3>
            <p><b>艺术控的天堂。</b>周末有创意市集和设计师集,很大的夜市,基本都是 DIY 作品,样子精致漂亮 — 唯一缺点是<b>小贵</b>,但真的市面上买不到。</p>
          </div>
        </article>

        <article class="poi">
          <div class="poi-rank">02</div>
          <div class="poi-body">
            <h3>雕塑瓷厂 <span class="dist">离陶溪川 3 km</span></h3>
            <p><b>性价比天花板。</b>一进去<b>别急着买</b>,多问几家价格,很多店款式高度相似。手串、冰箱贴、杯子、陶瓷花……品类极多。</p>
          </div>
        </article>

        <article class="poi">
          <div class="poi-rank">03</div>
          <div class="poi-body">
            <h3>陶阳新村夜市 <span class="dist">离陶溪川 3 km</span></h3>
            <p><b>夜市价格最便宜</b>,种类丰富,适合慢慢淘伴手礼。</p>
          </div>
        </article>

        <aside class="tip">
          💡 <b>建议买什么</b>:茶具整套、碗筷整套、小工艺品(耳坠类) — 回家送人有面子又不贵。
        </aside>
      </section>

      <!-- 博物馆 -->
      <section class="block">
        <h2><span class="ic">🏛️</span> 博物馆(选 1–2 个就够)</h2>

        <article class="poi">
          <div class="poi-rank">04</div>
          <div class="poi-body">
            <h3>中国陶瓷博物馆</h3>
            <p>打卡传说中的「<b>无语佛</b>」🤐,顺便了解瓷器发展史,适合喜欢文化背景的朋友。</p>
            <ul class="warns">
              <li>需提前 <b>3–7 天</b>在公众号「畅游景德镇」预约</li>
              <li><b>周一闭馆</b></li>
            </ul>
          </div>
        </article>

        <article class="poi">
          <div class="poi-rank">05</div>
          <div class="poi-body">
            <h3>御窑博物馆</h3>
            <p><b>白天去</b>,建筑本身就是艺术(获过国际大奖),能看到出土瓷片和窑炉遗址。</p>
            <ul class="warns">
              <li>需提前 <b>3–7 天</b>在公众号「畅游景德镇」预约</li>
              <li><b>周一闭馆</b></li>
              <li>门票:陶阳里通票 <b>¥53</b>(含御窑+周边),晚上 8 点后可能免费开放</li>
            </ul>
          </div>
        </article>
      </section>

      <!-- DIY -->
      <section class="block">
        <h2><span class="ic">🎨</span> 还可以做的</h2>
        <p><b>DIY 陶瓷体验</b>:陶溪川和雕塑瓷厂附近都有体验店,自己拉个胚做个杯子带走,挺有意义。看店挑一家就行。</p>
      </section>

      <!-- 交通 -->
      <section class="block">
        <h2><span class="ic">🚗</span> 交通</h2>

        <div class="transport-card">
          <h3 class="sub-h">乐平 → 景德镇</h3>
          <p>🚐 <b>我们统一安排车送过去</b>,你不用自己打车 / 抢车。具体时间到时<b>私聊就行,随时都有车</b>。</p>
        </div>

        <div class="transport-card">
          <h3 class="sub-h">到景德镇后</h3>
          <p>🎈 自由活动,逛吃由你。市内推荐两种代步:</p>
          <table class="t-table">
            <thead>
              <tr><th>方式</th><th>价格</th><th>推荐度</th></tr>
            </thead>
            <tbody>
              <tr>
                <td><b>租电瓶车</b></td>
                <td>¥30–40 / 天</td>
                <td>⭐️⭐️⭐️⭐️⭐️ 景点分散最实用,<b>记得戴头盔</b></td>
              </tr>
              <tr>
                <td>打车</td>
                <td>市区起步价</td>
                <td>⭐️⭐️⭐️ 三宝村等偏远难打车</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <!-- 吃 -->
      <section class="block">
        <h2><span class="ic">🍜</span> 吃 · 不踩雷清单</h2>
        <p class="reason">📌 江西饭店<b>下限相对较高</b>,**基本不踩大雷** — 下面列的都是亲测安利,放心冲。</p>

        <h3 class="sub-h">本地特色 / 私房菜</h3>
        <ul class="food">
          <li><b>瓷都华姑姑私房菜</b> — 司机大哥安利的巷子小馆,<b>必须提前预约</b>,道道不踩雷,强推 <em>凉拌小青蛙 + 糖醋松子鱼</em> 💥</li>
          <li><b>欧记大排档</b> — 种类多,<b>烧烤一绝</b>,别去太晚(热门菜常售罄)</li>
          <li><b>回家吃饭</b> — 每道都好吃,<b>鱼汤一绝</b> 👍</li>
          <li><b>茶决决</b> — 本地网红,造型感强(出片好看)</li>
          <li><b>乐乐大排档 / 小黄鱼 / 东篱大院</b> — 都有特色</li>
        </ul>

        <h3 class="sub-h">小吃必尝</h3>
        <ul class="food">
          <li>景德镇<b>冷粉</b></li>
          <li><b>油条包麻糍</b></li>
          <li><b>瓦罐汤</b> — 江西灵魂,街边店随便挑一家都不会差</li>
        </ul>

        <aside class="tip dim">
          ⚠️ <b>炒粉跳过</b>:婚礼当天乐平的炒粉已经吃过了,景德镇的不如乐平。
        </aside>
      </section>

      <!-- 地图(简化示意,以陶溪川为中心) -->
      <!-- (地图已上移到住宿之后)-->

      <!-- 注意事项 -->
      <section class="block">
        <h2><span class="ic">⚠️</span> 注意事项 / 避坑</h2>
        <ol class="warn-list">
          <li><b>预约</b>:陶瓷博物馆 / 御窑博物馆需 3–7 天前在「畅游景德镇」公众号预约,<b>周一闭馆</b></li>
          <li><b>辣度</b>:江西菜默认偏辣,不能吃辣<b>主动说"微微辣"</b> — 但"微微辣"在江西也可能辣 🌶️</li>
          <li><b>砍价</b>:陶阳新村 + 雕塑瓷厂可砍。<b>有明显瑕疵的对半砍</b></li>
          <li><b>大件瓷器</b>:别自己扛,<b>让店家发物流</b>,几十块全国到家</li>
          <li><b>古董别碰</b>:景区"古董瓷器"基本都是做旧仿品,新手避雷</li>
          <li><b>不推荐</b>:瓷宫 / 民俗博览区,性价比一般(感兴趣再去)</li>
        </ol>
      </section>

      <!-- 结尾(精简,不再显示我俩) -->
      <footer class="end">
        <p>祝你这趟玩得开心 ☕️</p>
      </footer>
    </main>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { RouterLink } from 'vue-router'
import BgmPlayer from '@/components/BgmPlayer.vue'

onMounted(() => {
  document.title = '一日攻略 · 张三 ✕ 小美邀请函'
})
</script>

<style lang="scss" scoped>
@use '@/styles/tokens.scss' as *;

.guide-page {
  /* fixed 脱离文档流,自己当滚动容器,不受主站 #app/body overflow:hidden 影响 */
  position: fixed;
  inset: 0;
  width: 100%;
  height: 100dvh;
  overflow-y: auto;
  overflow-x: hidden;
  -webkit-overflow-scrolling: touch;
  overscroll-behavior: contain;
  background:
    radial-gradient(1200px 600px at 10% -10%, rgba(255, 217, 184, .35) 0%, transparent 60%),
    radial-gradient(900px 500px at 110% 10%, rgba(244, 196, 196, .25) 0%, transparent 60%),
    $bg;
  color: $text;
  font-family: $sans;
  padding-bottom: 8dvh;
  z-index: 100;
}

.topbar {
  position: sticky;
  top: 0;
  height: 4px;
  background: linear-gradient(90deg, $accent 0%, $soft 50%, $muted 100%);
  z-index: 5;
}

.back-btn {
  position: fixed;
  top: clamp(10px, 2dvh, 18px);
  left: clamp(10px, 3vw, 18px);
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  border-radius: 999px;
  background: rgba(255, 255, 255, .85);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  color: $text;
  text-decoration: none;
  font-size: clamp(.78rem, 3vw, .9rem);
  letter-spacing: .1em;
  box-shadow: 0 4px 14px rgba(45, 33, 24, .1);
  z-index: 110;
  transition: transform .15s;

  &:hover, &:active { transform: scale(1.04); }

  .arrow { font-family: $serif-en; font-style: italic; }
}

.content {
  max-width: 720px;
  margin: 0 auto;
  padding: clamp(20px, 5dvh, 40px) clamp(18px, 5vw, 32px) 0;
}

/* 标题 */
.head {
  text-align: center;
  margin-bottom: clamp(28px, 5dvh, 48px);

  .kicker {
    font-family: $serif-en;
    font-style: italic;
    letter-spacing: .35em;
    font-size: clamp(.72rem, 2.6vw, .82rem);
    color: $accent-deep;
    margin: 0 0 12px;
    text-transform: uppercase;
  }

  .title {
    font-family: $serif-zh;
    font-weight: 600;
    font-size: clamp(1.7rem, 7vw, 2.6rem);
    letter-spacing: clamp(.1em, .6vw, .2em);
    margin: 0 0 14px;
    line-height: 1.15;
    color: $text;
  }

  .sub {
    font-family: $serif-zh;
    color: rgba(45, 33, 24, .7);
    font-size: clamp(.85rem, 3.4vw, .98rem);
    letter-spacing: .12em;
    margin: 0 0 6px;
  }

  .meta {
    margin: 0;
    font-size: clamp(.78rem, 3vw, .85rem);
    color: rgba(45, 33, 24, .55);
    letter-spacing: .08em;
  }
}

/* 卡片通用 */
.card {
  background: rgba(255, 255, 255, .65);
  backdrop-filter: blur(6px);
  -webkit-backdrop-filter: blur(6px);
  border-radius: 18px;
  padding: clamp(16px, 4vw, 22px);
  box-shadow: 0 4px 24px rgba(245, 165, 114, .1);
  border: 1px solid rgba(255, 217, 184, .35);
}

/* 开场卡 */
.intro {
  text-align: center;
  margin-bottom: clamp(28px, 5dvh, 40px);

  p { margin: 0 0 8px; line-height: 1.8; font-size: clamp(.92rem, 3.6vw, 1rem); }
  p:last-child { margin-bottom: 0; }

  .tag-line {
    margin-top: 16px !important;
    font-family: $serif-zh;
    font-size: clamp(1.05rem, 4.5vw, 1.3rem);
    letter-spacing: .15em;

    .hi {
      color: $accent-deep;
      font-weight: 600;
      margin: 0 4px;
    }
  }

  .caption {
    font-size: clamp(.78rem, 3vw, .85rem);
    color: rgba(45, 33, 24, .55);
    letter-spacing: .08em;
    margin-top: 4px !important;
  }
}

.time-list {
  list-style: none;
  padding: 0;
  margin: 12px 0;
  display: grid;
  gap: 6px;

  li {
    padding: 8px 12px;
    background: rgba(255, 217, 184, .25);
    border-radius: 8px;
    font-size: clamp(.85rem, 3.4vw, .92rem);
    line-height: 1.5;
    text-align: left;

    b { color: $accent-deep; margin-right: 6px; }

    &.rec {
      background: linear-gradient(135deg, rgba(245, 165, 114, .3), rgba(255, 217, 184, .45));
      border: 1px solid rgba(245, 165, 114, .4);
      box-shadow: 0 2px 8px rgba(245, 165, 114, .15);
    }
  }
}

/* 板块 */
.block {
  margin-bottom: clamp(32px, 6dvh, 56px);

  h2 {
    display: flex;
    align-items: center;
    gap: 10px;
    font-family: $serif-zh;
    font-weight: 600;
    font-size: clamp(1.2rem, 5vw, 1.55rem);
    letter-spacing: .12em;
    margin: 0 0 18px;
    padding-bottom: 12px;
    border-bottom: 2px solid rgba(245, 165, 114, .3);
    color: $text;

    .ic { font-size: 1.2em; }
  }

  > p, > ul {
    line-height: 1.85;
    font-size: clamp(.92rem, 3.6vw, 1rem);
  }
}

.list, .food, .warns {
  list-style: none;
  padding: 0;
  margin: 0;

  li {
    padding: 8px 0 8px 22px;
    position: relative;
    line-height: 1.75;
    font-size: clamp(.9rem, 3.6vw, .98rem);

    &::before {
      content: '·';
      position: absolute;
      left: 8px;
      color: $accent-deep;
      font-weight: 700;
      font-size: 1.4em;
      line-height: 1;
      top: 12px;
    }

    em {
      font-family: $serif-zh;
      font-style: normal;
      color: $accent-deep;
      font-weight: 500;
    }
  }
}

.reason {
  background: rgba(255, 217, 184, .25);
  border-left: 3px solid $accent;
  padding: 12px 14px;
  border-radius: 8px;
  margin: 0 0 16px;
  font-size: clamp(.88rem, 3.5vw, .95rem);
  line-height: 1.7;
}

.warns li::before { content: '⚠️'; font-size: .8em; top: 12px; }

.warn-list {
  list-style: none;
  counter-reset: warn-c;
  padding: 0;
  margin: 0;

  li {
    counter-increment: warn-c;
    position: relative;
    padding: 12px 0 12px 38px;
    line-height: 1.75;
    font-size: clamp(.9rem, 3.6vw, .98rem);
    border-bottom: 1px dashed rgba(110, 92, 142, .15);

    &::before {
      content: counter(warn-c, decimal-leading-zero);
      position: absolute;
      left: 0;
      top: 13px;
      font-family: $serif-en;
      font-style: italic;
      font-weight: 600;
      color: $accent-deep;
      font-size: .9em;
    }

    &:last-child { border-bottom: 0; }
  }
}

.price {
  display: inline-block;
  margin-left: 6px;
  padding: 1px 8px;
  border-radius: 4px;
  background: rgba(245, 165, 114, .15);
  color: $accent-deep;
  font-family: $serif-en;
  font-style: italic;
  font-size: .82em;
}

/* POI */
.poi {
  display: flex;
  gap: 14px;
  align-items: flex-start;
  margin-bottom: 22px;
  padding: 16px;
  background: rgba(255, 255, 255, .55);
  border-radius: 14px;
  border-left: 3px solid $accent;

  &-rank {
    flex-shrink: 0;
    font-family: $serif-en;
    font-style: italic;
    font-weight: 600;
    font-size: clamp(1.5rem, 6vw, 1.9rem);
    color: $accent-deep;
    line-height: 1;
    width: 38px;
    text-align: center;
  }

  &-body {
    flex: 1;
    min-width: 0;

    h3 {
      margin: 0 0 6px;
      font-family: $serif-zh;
      font-size: clamp(1rem, 4.2vw, 1.15rem);
      letter-spacing: .08em;
      font-weight: 600;
      display: flex;
      align-items: baseline;
      gap: 8px;
      flex-wrap: wrap;
    }

    p {
      margin: 0;
      line-height: 1.75;
      font-size: clamp(.88rem, 3.5vw, .95rem);
      color: rgba(45, 33, 24, .85);
    }

    .stars { font-size: .7em; }

    .dist {
      font-size: .75em;
      color: rgba(45, 33, 24, .5);
      font-weight: 400;
      letter-spacing: .05em;
    }

    .warns { margin-top: 8px; }
  }
}

/* tip */
.tip {
  margin-top: 16px;
  padding: 12px 16px;
  border-radius: 10px;
  background: rgba(255, 217, 184, .35);
  border: 1px solid rgba(245, 165, 114, .35);
  font-size: clamp(.85rem, 3.4vw, .92rem);
  line-height: 1.7;

  &.dim {
    background: rgba(110, 92, 142, .08);
    border-color: rgba(110, 92, 142, .15);
  }
}

/* sub heading */
.sub-h {
  font-family: $serif-zh;
  font-weight: 600;
  font-size: clamp(.95rem, 3.8vw, 1.05rem);
  letter-spacing: .1em;
  margin: 18px 0 8px;
  padding-left: 10px;
  border-left: 3px solid $accent;
  color: $accent-deep;
}

/* 交通表格 */
.t-table {
  width: 100%;
  border-collapse: collapse;
  margin: 0;
  font-size: clamp(.85rem, 3.4vw, .92rem);

  thead th {
    text-align: left;
    padding: 10px 8px;
    background: rgba(245, 165, 114, .12);
    color: $accent-deep;
    font-weight: 600;
    letter-spacing: .08em;
    border-bottom: 2px solid rgba(245, 165, 114, .3);
  }

  td {
    padding: 12px 8px;
    border-bottom: 1px dashed rgba(110, 92, 142, .15);
    line-height: 1.6;
    vertical-align: top;
  }

  tr:last-child td { border-bottom: 0; }
}

/* 结尾 */
.end {
  text-align: center;
  margin-top: clamp(40px, 8dvh, 64px);
  padding: clamp(24px, 5dvh, 36px) clamp(20px, 5vw, 32px);
  border-radius: 18px;
  background: linear-gradient(135deg, rgba(255, 217, 184, .35), rgba(244, 196, 196, .35));

  p {
    margin: 0 0 6px;
    font-family: $serif-zh;
    font-size: clamp(.95rem, 3.8vw, 1.08rem);
    line-height: 1.85;
    letter-spacing: .1em;
  }

  .signature {
    margin-top: 18px !important;
    font-family: $serif-en;
    font-style: italic;
    font-size: clamp(.82rem, 3.2vw, .9rem);
    color: $accent-deep;
    letter-spacing: .12em;
  }
}

/* 窄屏微调 */
@media (max-width: 360px) {
  .content { padding: 24px 14px 0; }
  .poi { padding: 12px; gap: 10px; }
  .poi-rank { width: 32px; }
}

/* 交通板块卡片 */
.transport-card {
  background: rgba(255, 255, 255, .55);
  border-radius: 12px;
  padding: clamp(12px, 3vw, 18px);
  margin-bottom: 14px;
  border-left: 3px solid $accent;

  > p {
    margin: 8px 0 12px;
    line-height: 1.7;
    font-size: clamp(.9rem, 3.6vw, .98rem);
  }

  .sub-h {
    margin-top: 0;
    margin-bottom: 4px;
    border-left: 0;
    padding-left: 0;
  }

  &:last-child { margin-bottom: 0; }
}

/* 地图 */
.map-card {
  background: rgba(255, 255, 255, .55);
  border-radius: 14px;
  padding: clamp(8px, 2vw, 14px);
  border: 1px solid rgba(245, 165, 114, .25);
  box-shadow: 0 4px 16px rgba(245, 165, 114, .08);
}

.map-svg {
  width: 100%;
  height: auto;
  max-height: 60dvh;
  display: block;
  border-radius: 10px;
}

.map-tip {
  margin: 12px 4px 4px;
  font-size: clamp(.82rem, 3.2vw, .92rem);
  color: rgba(45, 33, 24, .75);
  line-height: 1.6;
  letter-spacing: .05em;
}
</style>
