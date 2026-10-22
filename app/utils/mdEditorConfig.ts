/** Side-effect module: md-editor-v3 lazy-loads mermaid from a CDN (11.x by default), so hand it the
 * installed package instead. Imported by the components that render md-editor, so mermaid stays out
 * of the initial bundle (see `LazyCardModal` in `pages/boards/[id].vue`). */
import { config } from 'md-editor-v3'
import mermaid from 'mermaid'
import '@fontsource-variable/recursive'

// The font is lazy-loaded on first use; mermaid measures labels at render time, so a late load makes
// text wider than its box (clipped edge labels). Warm it up as soon as this module loads.
if (import.meta.client) void document.fonts.load('16px "Recursive Variable"')

config({
  // Same look as mermaid.live: the `neo` look (rounded nodes, soft shadows, crisp strokes).
  mermaidConfig: base => ({
    startOnLoad: false,
    // md-editor's own `base` theme + themeVariables would override the neo palette, so drop them.
    theme: base.theme === 'dark' ? 'neo-dark' : 'neo',
    look: 'neo',
    fontFamily: '"Recursive Variable", ui-monospace, Menlo, Consolas, monospace',
    // themes read the font from themeVariables, not the top-level option
    themeVariables: { fontFamily: '"Recursive Variable", ui-monospace, Menlo, Consolas, monospace' },
    // SVG <text> labels are measured and drawn with the same font, so they stay centered in nodes
    // (HTML foreignObject labels get measured with a different font than the editor CSS renders).
    htmlLabels: false,
    flowchart: { ...base?.flowchart, htmlLabels: false, curve: 'basis', padding: 16 }
  }),
  // `![video](url)` renders as a playable <video>; uploads of video files insert it with that alt.
  markdownItConfig(md) {
    const defaultImage = md.renderer.rules.image
    md.renderer.rules.image = (tokens, idx, options, env, self) => {
      const token = tokens[idx]!
      if (token.content.trim().toLowerCase() === 'video') {
        const src = md.utils.escapeHtml(token.attrGet('src') ?? '')
        return `<video controls preload="metadata" src="${src}" style="max-width:100%"></video>`
      }
      return defaultImage ? defaultImage(tokens, idx, options, env, self) : self.renderToken(tokens, idx, options)
    }
  },
  editorExtensions: {
    mermaid: {
      instance: mermaid
    }
  }
})
