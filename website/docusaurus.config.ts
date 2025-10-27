import {themes as prismThemes} from 'prism-react-renderer';
import type {Config} from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';

const config: Config = {
  title: 'Tansu',
  tagline: 'Bringing open source software development to the Stellar blockchain',
  favicon: 'img/logo.svg',

  future: {
    v4: true, // Improve compatibility with the upcoming Docusaurus v4
  },

  // Set the production url of your site here
  url: 'https://tansu.dev',
  // Set the /<baseUrl>/ pathname under which your site is served
  // For GitHub pages deployment, it is often '/<projectName>/'
  baseUrl: '/',

  // GitHub pages deployment config.
  // If you aren't using GitHub pages, you don't need these.
  // organizationName: 'tansu', // Usually your GitHub org/user name.
  // projectName: 'soroban-versioning', // Usually your repo name.

  onBrokenLinks: 'throw',

  // Even if you don't use internationalization, you can use this field to set
  // useful metadata like html lang. For example, if your site is Chinese, you
  // may want to replace "en" with "zh-Hans".
  i18n: {
    defaultLocale: 'en',
    locales: ['en'],
  },

  markdown: {
    mermaid: true,
  },

  presets: [
    [
      'classic',
      {
        docs: {
          sidebarPath: './sidebars.ts',
          remarkPlugins: [remarkMath],
          rehypePlugins: [rehypeKatex],
        },
        blog: {
          showReadingTime: true,
          remarkPlugins: [remarkMath],
          rehypePlugins: [rehypeKatex],
        },
        theme: {
          customCss: './src/css/custom.css',
        },
      } satisfies Preset.Options,
    ],
  ],

  stylesheets: [
    {
      href: 'https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css',
      type: 'text/css',
      integrity:
        'sha384-odtC+0UGzzFL/6PNoE8rX/SPcQDXBJ+uRepguP4QkPCm2LBxH3FA3y+fKSiJ+AmM',
      crossorigin: 'anonymous',
    },
  ],

  themes: ['@docusaurus/theme-mermaid'],

  themeConfig: {
    // Replace with your project's social card
    image: 'https://tansu.dev/img/logo.png',
    metadata: [
      {name: "x:creator", content: "@PamphileRoy"},
      {name: "x:card", content: "summary_large_image"},
      {
        name: "x:image",
        content: "https://app.tansu.dev/logo.svg",
      },
      {name: "x:title", content: "Tansu"},
      {
        name: "x:description",
        content:
          "Bringing open source software development onto the Stellar blockchain",
      },
    ],
    navbar: {
      title: 'Tansu',
      logo: {
        alt: 'Tansu Logo',
        src: 'img/logo.svg',
      },
      items: [
        {
          type: 'docSidebar',
          sidebarId: 'tutorialSidebar',
          position: 'left',
          label: 'Documentation',
        },
        {to: '/blog', label: 'Blog', position: 'left'},
        {
          href: 'https://app.tansu.dev',
          label: 'Launch App',
          position: 'right',
        },
      ],
    },
    footer: {
      style: 'dark',
      copyright: `<p>Copyright © ${new Date().getFullYear()} Tansu. Made by <a href="https://consulting-manao.com">Consulting Manao GmbH</a> | <a href="/docs/terms-of-service">Terms of Service</a> | <a href="/docs/privacy-policy">Privacy Policy</a></p>`,
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
    },
  } satisfies Preset.ThemeConfig,
};

export default config;
