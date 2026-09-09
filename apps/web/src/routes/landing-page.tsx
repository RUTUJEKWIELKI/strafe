import {
  ArrowRight,
  Check,
  ChevronRight,
  Hash,
  Headphones,
  LockKeyhole,
  Menu,
  MessageCircle,
  Mic,
  Paperclip,
  Play,
  Plus,
  Search,
  ShieldCheck,
  Smile,
  Sparkles,
  Users,
  Video,
  X,
} from 'lucide-solid'
import { createSignal, For, Show } from 'solid-js'
import { useTranslation } from 'solid-i18next'

import { TurtleMark } from '../components/brand/turtle-mark.js'
import { LanguageSelect } from '../components/language-select.js'

const communities = [
  { color: '#f4ca45', initials: 'CD', label: 'Creative Dept.' },
  { color: '#7bc6a4', initials: 'FM', label: 'Film makers' },
  { color: '#ef9d7d', initials: 'IX', label: 'Indie × Studio' },
]

const features = [
  {
    icon: MessageCircle,
    key: 'conversations',
    number: '01',
  },
  {
    icon: Headphones,
    key: 'calls',
    number: '02',
  },
  {
    icon: ShieldCheck,
    key: 'privacy',
    number: '03',
  },
] as const

function Wordmark() {
  const [t] = useTranslation()
  return (
    <a class="wordmark" href="#top" aria-label={t('brand.home')}>
      <TurtleMark />
      <span>strafe</span>
    </a>
  )
}

function ProductPreview() {
  const [t] = useTranslation()
  const messages = [
    {
      avatar: 'MK',
      color: '#c8e76d',
      name: 'Maja',
      text: t('preview.messageOne'),
      time: '10:42',
    },
    {
      avatar: 'OL',
      color: '#82d2b0',
      name: 'Olek',
      text: t('preview.messageTwo'),
      time: '10:44',
    },
  ]

  return (
    <div class="preview-wrap" aria-label={t('preview.label')}>
      <div class="floating-note floating-note--top">
        <span class="status-dot" />
        {t('preview.online')}
      </div>
      <div class="app-window">
        <div class="window-bar">
          <div class="window-dots">
            <i />
            <i />
            <i />
          </div>
          <div class="window-title">
            <LockKeyhole size={12} /> strafe.app
          </div>
          <div class="window-actions">
            <Search size={15} />
            <span class="avatar avatar--tiny">TY</span>
          </div>
        </div>
        <div class="app-grid">
          <aside class="servers" aria-label={t('preview.communities')}>
            <TurtleMark class="server-logo" />
            <div class="server-divider" />
            <For each={communities}>
              {(community) => (
                <div
                  class="server-avatar"
                  style={{ '--server-color': community.color }}
                  title={community.label}
                >
                  {community.initials}
                </div>
              )}
            </For>
            <button class="server-add" aria-label={t('preview.addCommunity')}>
              <Plus size={17} />
            </button>
          </aside>
          <aside class="channels">
            <div class="workspace-title">
              Creative Dept. <ChevronRight size={14} />
            </div>
            <p class="channel-section">{t('preview.space')}</p>
            <div class="channel channel--active">
              <Hash size={15} /> {t('preview.general')}
            </div>
            <div class="channel">
              <Hash size={15} /> {t('preview.inspiration')} <span>3</span>
            </div>
            <div class="channel">
              <Hash size={15} /> {t('preview.projects')}
            </div>
            <p class="channel-section">{t('preview.conversations')}</p>
            <div class="channel">
              <Headphones size={15} /> {t('preview.studio')}
            </div>
            <div class="channel">
              <Headphones size={15} /> {t('preview.coffee')}
            </div>
            <div class="profile-card">
              <span class="avatar avatar--small">TY</span>
              <span>
                <b>{t('preview.you')}</b>
                <small>online</small>
              </span>
              <Mic size={14} />
            </div>
          </aside>
          <main class="conversation">
            <header class="conversation-header">
              <div>
                <Hash size={17} />
                <span>{t('preview.general')}</span>
                <i /> <small>{t('preview.channelDescription')}</small>
              </div>
              <div>
                <Video size={16} />
                <Users size={16} />
              </div>
            </header>
            <div class="conversation-body">
              <div class="day-pill">{t('preview.today')}</div>
              <For each={messages}>
                {(message) => (
                  <article class="message">
                    <span
                      class="avatar"
                      style={{ '--avatar-color': message.color }}
                    >
                      {message.avatar}
                    </span>
                    <div>
                      <p>
                        <b>{message.name}</b>
                        <time>{message.time}</time>
                      </p>
                      <span>{message.text}</span>
                    </div>
                  </article>
                )}
              </For>
              <div class="image-share">
                <div class="image-art">
                  <span>
                    MAKE
                    <br />
                    SPACE
                    <br />
                    <em>FOR IDEAS</em>
                  </span>
                </div>
                <div class="reaction">💚 4</div>
              </div>
              <div class="typing">
                <i />
                <i />
                <i /> {t('preview.typing')}
              </div>
            </div>
            <div class="composer">
              <Plus size={16} />
              <span>{t('preview.composer')}</span>
              <Paperclip size={16} />
              <Smile size={16} />
            </div>
          </main>
        </div>
      </div>
      <div class="floating-note floating-note--bottom">
        <div class="note-icon">
          <ShieldCheck size={19} />
        </div>
        <span>
          <b>{t('preview.privateTitle')}</b>
          <small>{t('preview.privateText')}</small>
        </span>
        <Check size={17} />
      </div>
    </div>
  )
}

export function LandingPage() {
  const [menuOpen, setMenuOpen] = createSignal(false)
  const [t] = useTranslation()

  return (
    <div class="site-shell" id="top">
      <header class="site-header">
        <Wordmark />
        <nav class="desktop-nav" aria-label={t('navigation.main')}>
          <a href="#mozliwosci">{t('navigation.features')}</a>
          <a href="#prywatnosc">{t('navigation.privacy')}</a>
          <a href="#dla-kogo">{t('navigation.audience')}</a>
        </nav>
        <div class="header-actions">
          <LanguageSelect />
          <a class="header-cta" href="/login">
            {t('navigation.open')} <ArrowRight size={15} />
          </a>
        </div>
        <button
          class="menu-button"
          aria-expanded={menuOpen()}
          aria-label={t('navigation.menu')}
          onClick={() => setMenuOpen(!menuOpen())}
        >
          <Show when={menuOpen()} fallback={<Menu />}>
            <X />
          </Show>
        </button>
        <Show when={menuOpen()}>
          <nav class="mobile-nav" aria-label={t('navigation.mobile')}>
            <a href="#mozliwosci" onClick={() => setMenuOpen(false)}>
              {t('navigation.features')}
            </a>
            <a href="#prywatnosc" onClick={() => setMenuOpen(false)}>
              {t('navigation.privacy')}
            </a>
            <a href="#dla-kogo" onClick={() => setMenuOpen(false)}>
              {t('navigation.audience')}
            </a>
            <a href="/login" onClick={() => setMenuOpen(false)}>
              {t('navigation.open')}
            </a>
            <LanguageSelect />
          </nav>
        </Show>
      </header>

      <main>
        <section class="hero">
          <div class="hero-copy">
            <div class="eyebrow">
              <Sparkles size={14} /> {t('hero.eyebrow')}
            </div>
            <h1>
              {t('hero.titleFirst')}
              <br />
              <em>{t('hero.titleSecond')}</em>
            </h1>
            <p>{t('hero.description')}</p>
            <div class="hero-actions">
              <a class="button button--primary" href="/register">
                {t('hero.primaryAction')} <ArrowRight size={17} />
              </a>
              <a class="button button--text" href="#mozliwosci">
                <span>
                  <Play size={13} fill="currentColor" />
                </span>
                {t('hero.secondaryAction')}
              </a>
            </div>
            <div class="hero-proof">
              <div class="proof-avatars">
                <span>MK</span>
                <span>OL</span>
                <span>LA</span>
                <span>+2k</span>
              </div>
              <p>
                <b>{t('hero.proofTitle')}</b>
                <br />
                {t('hero.proofText')}
              </p>
            </div>
          </div>
          <ProductPreview />
          <div class="hero-scribble" aria-hidden="true">
            ↝
          </div>
        </section>

        <section class="trust-strip" aria-label={t('trust.title')}>
          <p>{t('trust.title')}</p>
          <div>
            <span>
              <Check /> {t('trust.noAds')}
            </span>
            <span>
              <Check /> {t('trust.noTracking')}
            </span>
            <span>
              <Check /> {t('trust.noPressure')}
            </span>
          </div>
        </section>

        <section class="features" id="mozliwosci">
          <div class="section-heading">
            <div>
              <span class="kicker">{t('features.kicker')}</span>
              <h2>
                {t('features.titleFirst')}
                <br />
                <em>{t('features.titleSecond')}</em>
              </h2>
            </div>
            <p>{t('features.introduction')}</p>
          </div>
          <div class="feature-grid">
            <For each={features}>
              {(feature) => {
                const Icon = feature.icon
                return (
                  <article class="feature-card">
                    <span class="feature-number">{feature.number}</span>
                    <div class="feature-icon">
                      <Icon />
                    </div>
                    <h3>{t(`features.items.${feature.key}.title`)}</h3>
                    <p>{t(`features.items.${feature.key}.description`)}</p>
                    <a href="/register">
                      {t('features.learnMore')} <ArrowRight size={15} />
                    </a>
                  </article>
                )
              }}
            </For>
          </div>
        </section>

        <section class="privacy" id="prywatnosc">
          <div class="privacy-art">
            <div class="orbit orbit--one" />
            <div class="orbit orbit--two" />
            <TurtleMark />
            <span class="privacy-badge privacy-badge--one">
              <LockKeyhole /> {t('privacy.encrypted')}
            </span>
            <span class="privacy-badge privacy-badge--two">
              <ShieldCheck /> {t('privacy.controlled')}
            </span>
          </div>
          <div class="privacy-copy">
            <span class="kicker">{t('privacy.kicker')}</span>
            <h2>
              {t('privacy.titleFirst')}
              <br />
              <em>{t('privacy.titleSecond')}</em>
            </h2>
            <p>{t('privacy.description')}</p>
            <ul>
              <li>
                <Check /> {t('privacy.encryption')}
              </li>
              <li>
                <Check /> {t('privacy.settings')}
              </li>
              <li>
                <Check /> {t('privacy.noSale')}
              </li>
            </ul>
          </div>
        </section>

        <section class="closing" id="dla-kogo">
          <span class="kicker">{t('closing.kicker')}</span>
          <h2>
            {t('closing.titleFirst')}
            <br />
            <em>{t('closing.titleSecond')}</em>
          </h2>
          <p>{t('closing.description')}</p>
          <a class="button button--dark" href="/register">
            {t('closing.action')} <ArrowRight size={17} />
          </a>
          <TurtleMark class="closing-turtle" />
        </section>
      </main>

      <footer id="start">
        <div>
          <Wordmark />
          <p>{t('footer.tagline')}</p>
        </div>
        <div class="footer-links">
          <a href="#mozliwosci">{t('footer.product')}</a>
          <a href="#prywatnosc">{t('footer.privacy')}</a>
          <a href="/docs">{t('footer.documentation')}</a>
        </div>
        <p class="copyright">{t('footer.copyright')}</p>
      </footer>
    </div>
  )
}
