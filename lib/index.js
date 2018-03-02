const {TextEditor} = require('atom')
const {
  getAdjacentPane,
  splitPane,
  getDockForLocation,
  getValidIndexForList,
  moveItemToPane,
  getLocationForItem
} = require('./utils')

function getCenterPaneForOutlet ({useAdjacentPane, split = 'right'}) {
  const basePane = atom.workspace.getCenter().getActivePane()
  if (useAdjacentPane) {
    const pane = getAdjacentPane(basePane)
    if (pane) {
      return pane
    }
  }

  const activePane = atom.workspace.getActivePane()
  const pane = splitPane(basePane, split)
  activePane.activate()
  return pane
}

const DEFAULT_OPTIONS = {
  buffer: undefined,
  allowedLocations: ['center', 'bottom'],
  defaultLocation: ['bottom'],
  split: 'right',
  title: undefined,
  trackModified: false,
  classList: [],
  useAdjacentPane: true,
  extendsTextEditor: false
}

function create (options) {
  const editorOptions = {autoHeight: false}

  if (options.buffer) {
    editorOptions.buffer = options.buffer
  }

  const editor = new TextEditor(editorOptions)
  atom.commands.add(editor.element, {
    'core:close': () => editor.destroy()
  })

  const {
    allowedLocations,
    title,
    trackModified,
    classList,
    defaultLocation,
    split,
    useAdjacentPane,
    extendsTextEditor
  } = Object.assign({}, DEFAULT_OPTIONS, options)

  editor.getAllowedLocations = () => allowedLocations
  if (title) {
    editor.getTitle = () => title
  }
  if (!trackModified) {
    editor.buffer.isModified = () => false
  }
  editor.element.classList.add(...classList)
  editor.element.setAttribute('outlet', '')
  editor.element.setAttribute('outlet-default-location', defaultLocation)
  editor.element.setAttribute('outlet-split', split)
  if (useAdjacentPane) {
    editor.element.setAttribute('outlet-use-adjacent-pane', '')
  }

  if (extendsTextEditor) {
    const mixin = {open, relocate, show, hide}
    for (const key in mixin) {
      if (key in editor) {
        throw new Error(`\`extendsEditor\` options will overwrite ${key}`)
      }
      const fn = mixin[key]
      mixin[key] = fn.bind(null, editor)
    }
    Object.assign(editor, mixin)
  }
  return editor
}

async function open (editor) {
  await atom.workspace.open(editor, {
    activatePane: false,
    pane: getPaneForLocation(editor)
  })
  show(editor)
  return editor
}

function getPaneForLocation (editor, location = null) {
  if (!location) {
    location = editor.element.getAttribute('outlet-default-location')
  }

  if (location === 'center') {
    return getCenterPaneForOutlet({
      useAdjacentPane: editor.element.hasAttribute('outlet-use-adjacent-pane'),
      split: editor.element.getAttribute('outlet-split')
    })
  } else {
    return getDockForLocation(location).getActivePane()
  }
}

function relocate (editor, backwards) {
  const allowedLocations = editor.getAllowedLocations()
  if (allowedLocations.length < 2) return

  const delta = backwards ? -1 : +1
  const index = allowedLocations.indexOf(getLocationForItem(editor))
  const newIndex = getValidIndexForList(allowedLocations, index + delta)
  const location = allowedLocations[newIndex]

  moveItemToPane(editor, getPaneForLocation(editor, location))
  show(editor)
}

function show (editor) {
  atom.workspace.paneForItem(editor).activateItem(editor)
  const location = getLocationForItem(editor)
  if (location !== 'center') {
    getDockForLocation(location).show()
  }
}

function hide (editor) {
  atom.workspace.hide(editor)
}

module.exports = {open, create, relocate, show, hide}
