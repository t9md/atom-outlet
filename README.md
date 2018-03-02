# atom-outlet

Library to create outlet

- Close from keyboard without focusing
- Hide from keyboard without focusing
- Relocate from keyboard without focusing
- Open in dock or center pane with sugar options like `center-right`, `center-down`, `dock-bottom`, `dock-right`

## How to use

### `extendsEditor: true`  

```javascript
const outlet = require('atom-outlet')

// outlet.create return instance of TextEditor
// which have special `open`, `relocate`, `show`, `hide`
const editor = outlet.create({
  title: 'Google Translate',
  classList: ['google-transalte-editor'],
  defaultLocation: atom.config.get('google-translate.openLocation'),
  extendsTextEditor: true
})

await editor.open()
editor.hide()
editor.show()
editor.relocate()
```

### `extendsEditor: false`  

```javascript
const outlet = require('atom-outlet')

// outlet.create return instance of TextEditor
// which have special `open`, `relocate`, `show`, `hide`
const editor = outlet.create({
  title: 'Google Translate',
  classList: ['google-transalte-editor'],
  defaultLocation: atom.config.get('google-translate.openLocation'),
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
  allowedLocations: ['center', 'bottom'],
  defaultLocation: ['dock-bottom'],
  title: undefined,
  trackModified: false,
  classList: [],
  useAdjacentPane: true,
  extendsTextEditor: false
}
```
