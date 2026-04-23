import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { pascalToSlug } from '../.vitepress/utils';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '../../');
const nodesDir = path.resolve(rootDir, 'lib/nodes');

export default {
  watch: [path.resolve(nodesDir, "**/*.md")],
  async paths(watchedFiles: string[]) {
    return watchedFiles.map((f) => {
      const fileRelativePath = path.relative(nodesDir, f)
      const nodeDir = path.dirname(fileRelativePath)
      const nodeName = path.basename(nodeDir)
      return {
        params: {
          node: pascalToSlug(nodeName),
        },
        content: fs.readFileSync(f, 'utf-8')
      }
    })
  },
}
