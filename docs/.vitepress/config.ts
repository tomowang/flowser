import { defineConfig } from 'vitepress'
import path from 'node:path'
import fs from 'node:fs'
import { pascalToSlug, pascalToTitleCase } from './utils'

function getNodeSidebarItems() {
  const nodesDir = path.resolve(process.cwd(), 'lib/nodes');
  const items: any[] = [];
  if (fs.existsSync(nodesDir)) {
    const dirs = fs.readdirSync(nodesDir);
    for (const dir of dirs) {
      if (fs.statSync(path.join(nodesDir, dir)).isDirectory()) {
        if (fs.existsSync(path.join(nodesDir, dir, 'index.md'))) {
          items.push({
            text: pascalToTitleCase(dir),
            link: `/nodes/${pascalToSlug(dir)}`
          });
        }
      }
    }
  }
  return items.sort((a, b) => a.text.localeCompare(b.text));
}

// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: "Flowser",
  description: "Flowser - a browser extension for automating web workflows with AI",
  vite: {
    plugins: [
      {
        name: 'watch-node-docs',
        configureServer(server) {
          const watchPath = path.resolve(process.cwd(), 'lib/nodes')
          server.watcher.add(watchPath)
        }
      }
    ]
  },
  themeConfig: {
    // https://vitepress.dev/reference/default-theme-config
    logo: '/logo.svg',
    nav: [
      { text: 'Home', link: '/' },
      { text: 'Nodes', link: '/nodes/' }
    ],

    sidebar: [
      {
        text: 'Nodes',
        items: getNodeSidebarItems()
      },
    ],

    socialLinks: [
      { icon: 'github', link: 'https://github.com/tomowang/flowser' }
    ]
  }
})
