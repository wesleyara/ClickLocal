/** Side-effect module: md-editor-v3 lazy-loads mermaid from a CDN (11.x by default), so hand it the
 * installed package instead. Imported by the components that render md-editor, so mermaid stays out
 * of the initial bundle (see `LazyCardModal` in `pages/boards/[id].vue`). */
import { config } from 'md-editor-v3'
import mermaid from 'mermaid'

config({
  editorExtensions: {
    mermaid: {
      instance: mermaid
    }
  }
})
