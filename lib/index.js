const {TextEditor} = require('atom')
const {
  getAdjacentPane,
  splitPane,
  getDockForLocation,
  adjustIndexForList,
  moveItemToPane,
  getLocationForItem
} = require('./utils')

function getCenterPaneForOutlet ({basePane, useAdjacentPane, split = 'right'}) {
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
    const mixin = {open, relocate, show, hide, focus, toggle, link}
    for (const key in mixin) {
      if (key in editor) {
        throw new Error(`\`extendsEditor\` options will overwrite ${key}`)
      }
      editor[key] = mixin[key].bind(null, editor)
    }
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
      basePane: getLinkedCenterPane(editor) || atom.workspace.getCenter().getActivePane(),
      useAdjacentPane: editor.element.hasAttribute('outlet-use-adjacent-pane'),
      split: editor.element.getAttribute('outlet-split')
    })
  } else {
    return getDockForLocation(location).getActivePane()
  }
}

function getLinkedCenterPane (editor) {
  let linkedEditorId = editor.element.getAttribute('outlet-linked-editor-id')
  if (linkedEditorId != null) {
    linkedEditorId = Number(linkedEditorId)
    return atom.workspace
      .getCenter()
      .getPanes()
      .find(pane => {
        const editor = pane.getActiveEditor()
        return editor && editor.id === linkedEditorId
      })
  }
}

function relocate (editor, backwards) {
  const allowedLocations = editor.getAllowedLocations()
  if (allowedLocations.length > 1) {
    const delta = backwards ? -1 : +1
    const index = allowedLocations.indexOf(getLocationForItem(editor))
    const newIndex = adjustIndexForList(allowedLocations, index + delta)
    const location = allowedLocations[newIndex]

    moveItemToPane(editor, getPaneForLocation(editor, location))
    show(editor)
  }
}

function show (editor) {
  atom.workspace.paneForItem(editor).activateItem(editor)
  const location = getLocationForItem(editor)
  if (location !== 'center') {
    getDockForLocation(location).show()
  }
}

function hide (editor) {
  return atom.workspace.hide(editor)
}

// Avoid using atom.workspace.toggle, since I don't want to auto-focus to pane on show.
function toggle (editor) {
  hide(editor) || show(editor)
}

function focus (editor) {
  editor.element.focus()
}

// Only support link to editor in center container.
// when outlet(= editor here) is created from otherEditor
// Call this function to link editor(=outlet) to otherEditor.
// Linked editor will not be hidden while relocation.
function link (editor, otherEditor) {
  if (getLocationForItem(otherEditor) === 'center') {
    editor.element.setAttribute('outlet-linked-editor-id', otherEditor.id)
    console.log('linked', editor.element)
  }
}
module.exports = {open, create, relocate, show, hide, toggle, focus, link}
