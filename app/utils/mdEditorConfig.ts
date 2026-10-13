/** Side-effect module: md-editor-v3 lazy-loads mermaid from a CDN (11.x by default), so hand it the
 * installed package instead. Imported by the components that render md-editor, so mermaid stays out
 * of the initial bundle (see `LazyCardModal` in `pages/boards/[id].vue`). */
import { config } from 'md-editor-v3'
import mermaid from 'mermaid'

config({
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
