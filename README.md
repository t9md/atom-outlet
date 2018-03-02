# atom-outlet

Library to create outlet

- Close from keyboard without focusing
- Hide from keyboard without focusing
- Relocate from keyboard without focusing

## How to use

### `extendsEditor: true`  

```javascript
const outlet = require('atom-outlet')

// outlet.create return instance of TextEditor
// which have special `open`, `relocate`, `show`, `hide`
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
```

### `extendsEditor: false`  

```javascript
const outlet = require('atom-outlet')

// outlet.create return instance of TextEditor
// which have special `open`, `relocate`, `show`, `hide`
const editor = outlet.create({
  title: 'Sample outlet',
  classList: ['sample'],
  defaultLocation: 'bottom'
  extendsTextEditor: true
})

await outlet.open(editor)
outlet.hide(editor)
outlet.show(editor)
outlet.relocate(editor)
editor.relocate()
```

## Default options for `create`

``` javascript
const DEFAULT_OPTIONS = {
  buffer: undefined,
  allowedLocations: ['center', 'bottom'],  // One of ['center', 'bottom', 'left', 'right']
  defaultLocation: ['bottom'], // One of ['center', 'bottom', 'left', 'right']
  split: 'right', // Which direction  to split in center workspace
  title: undefined,
  trackModified: false, // When false, you won't be asked to save when closing outlet
  classList: [],
  useAdjacentPane: true, // By default pick adjacent pane to open outlet if exists.
  extendsTextEditor: false // Directly set four  method(open, relocate, hide, show) on editor(throw when conflicts)
}
```
