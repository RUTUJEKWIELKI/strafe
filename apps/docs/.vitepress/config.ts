import { defineConfig } from 'vitepress'
import { withMermaid } from 'vitepress-plugin-mermaid'

const base = process.env.DOCS_BASE ?? '/'

export default withMermaid(
  defineConfig({
    base,
    cleanUrls: true,
    description: 'Architecture, API, and contributor documentation for Strafe.',
    head: [
      [
        'link',
        { href: `${base}favicon.svg`, rel: 'icon', type: 'image/svg+xml' },
      ],
    ],
    lang: 'en-US',
    lastUpdated: true,
    markdown: {
      lineNumbers: true,
    },
    sitemap: {
      hostname: 'https://rutujekwielki.github.io/strafe/',
    },
    title: 'Strafe Documentation',
    themeConfig: {
      appearance: true,
      editLink: {
        pattern:
          'https://github.com/RUTUJEKWIELKI/strafe/edit/main/apps/docs/:path',
        text: 'Edit this page on GitHub',
      },
      footer: {
        message: 'Built from the Strafe clean-room rewrite.',
        copyright: 'Copyright © Strafe contributors',
      },
      nav: [
        { text: 'Overview', link: '/guide/introduction' },
        { text: 'Guides', link: '/guide/quickstart' },
        { text: 'Architecture', link: '/guide/system-overview' },
        { text: 'API Reference', link: '/api/reference' },
        {
          text: 'GitHub',
          link: 'https://github.com/RUTUJEKWIELKI/strafe',
        },
      ],
      outline: 'deep',
      search: {
        provider: 'local',
      },
      sidebar: {
        '/guide/': [
          {
            items: [
              { text: 'Introduction', link: '/guide/introduction' },
              { text: 'Quickstart', link: '/guide/quickstart' },
              { text: 'Core Concepts', link: '/guide/core-concepts' },
            ],
            text: 'Start Here',
          },
          {
            items: [
              {
                text: 'Authentication',
                link: '/guide/guides/authentication',
              },
              {
                text: 'Create a Community',
                link: '/guide/guides/community-setup',
              },
              {
                text: 'Roles and Permissions',
                link: '/guide/guides/permissions',
              },
              {
                text: 'Realtime Gateway',
                link: '/guide/guides/realtime',
              },
              {
                text: 'Files and Attachments',
                link: '/guide/guides/files',
              },
              { text: 'Voice', link: '/guide/guides/voice' },
            ],
            text: 'Guides',
          },
          {
            items: [
              { text: 'System Overview', link: '/guide/system-overview' },
              { text: 'Backend API', link: '/guide/backend-api' },
              {
                text: 'Data & Realtime Architecture',
                link: '/guide/data-realtime-architecture',
              },
              {
                text: 'Database & Operations',
                link: '/guide/database-operations',
              },
            ],
            text: 'Architecture',
          },
          {
            items: [
              { text: 'Interactive API', link: '/api/reference' },
              { text: 'TypeScript Contracts', link: '/api/generated/' },
              { text: 'Configuration', link: '/guide/configuration' },
            ],
            text: 'Reference',
          },
          {
            items: [
              { text: 'Roadmap', link: '/guide/roadmap' },
              { text: 'Repository Guide', link: '/guide/repository' },
              { text: 'Contributing', link: '/guide/contributing' },
              { text: 'Security Policy', link: '/guide/security' },
            ],
            text: 'Project',
          },
        ],
        '/api/': [
          {
            items: [
              { text: 'Interactive API Reference', link: '/api/reference' },
              { text: 'Generated TypeScript API', link: '/api/generated/' },
            ],
            text: 'API',
          },
        ],
      },
      socialLinks: [
        { icon: 'github', link: 'https://github.com/RUTUJEKWIELKI/strafe' },
      ],
    },
  }),
)
