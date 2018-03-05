# atom-outlet

Library to create outlet

- Close from keyboard without focusing
- Hide from keyboard without focusing
- Relocate from keyboard without focusing

## How to use

### Example

```javascript
const outlet = require('atom-outlet')

// outlet.create return instance of TextEditor
// which have special `open`, `relocate`, `show`, `hide`, `focus`, `toggle` methods.
const editor = outlet.create({
  title: 'Sample outlet',
  classList: ['sample'],
  defaultLocation: 'bottom'
  extendsTextEditor: true
})

await editor.open()
editor.hide() // atom.workspace.hide(editor)
editor.show() // show dock
editor.relocate() // relocate to center workspace
editor.toggle()
editor.show()
editor.focus()
```
## Default options for `create`

``` javascript
const DEFAULT_EDITOR_OPTIONS = {
  buffer: undefined,
  autoHeight: false
}

const DEFAULT_OPTIONS = {
  editorOptions: DEFAULT_EDITOR_OPTIONS,
  allowedLocations: ['center', 'bottom'],  // One of ['center', 'bottom', 'left', 'right']
  defaultLocation: ['bottom'], // One of ['center', 'bottom', 'left', 'right']
  split: 'right', // Which direction  to split in center workspace
  title: undefined,
  trackModified: false, // When false, you won't be asked to save when closing outlet
  classList: [],
  useAdjacentPane: true, // By default pick adjacent pane to open outlet if exists.
}
```
