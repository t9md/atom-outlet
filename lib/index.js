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
  editorOptions: null,
  allowedLocations: ['center', 'bottom'],
  defaultLocation: 'bottom',
  split: 'right',
  title: undefined,
  trackModified: false,
  classList: [],
  useAdjacentPane: true,
  extendsTextEditor: false
}

const DEFAULT_EDITOR_OPTIONS = {
  buffer: undefined,
  autoHeight: false
}

function create (options) {
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

  // [NOTE] outlet is just normal TextEditor with special attributes and methods.
  const outlet = new TextEditor(Object.assign({}, DEFAULT_EDITOR_OPTIONS, options.editorOptions))
  atom.commands.add(outlet.element, {
    'core:close': () => outlet.destroy()
  })

  outlet.getAllowedLocations = () => allowedLocations
  outlet.getDefaultLocation = () => defaultLocation
  if (title) {
    outlet.getTitle = () => title
  }
  if (!trackModified) {
    outlet.buffer.isModified = () => false
  }
  outlet.element.classList.add(...classList)
  outlet.element.setAttribute('outlet', '')
  outlet.element.setAttribute('outlet-split', split)
  if (useAdjacentPane) {
    outlet.element.setAttribute('outlet-use-adjacent-pane', '')
  }

  if (extendsTextEditor) {
    const mixin = {open, relocate, show, hide, focus, toggle, link}
    for (const key in mixin) {
      if (key in outlet) {
        throw new Error(`\`extendsEditor\` options will overwrite ${key}`)
      }
      outlet[key] = mixin[key].bind(null, outlet)
    }
  }
  return outlet
}

async function open (outlet) {
  await atom.workspace.open(outlet, {
    activatePane: false,
    pane: getPaneForOutlet(outlet)
  })
  show(outlet)
  return outlet
}

function getPaneForOutlet (outlet, location = null) {
  if (!location) {
    location = outlet.getDefaultLocation()
  }

  if (location === 'center') {
    return getCenterPaneForOutlet({
      basePane: getLinkedCenterPane(outlet) || atom.workspace.getCenter().getActivePane(),
      useAdjacentPane: outlet.element.hasAttribute('outlet-use-adjacent-pane'),
      split: outlet.element.getAttribute('outlet-split')
    })
  } else {
    return getDockForLocation(location).getActivePane()
  }
}

function getLinkedCenterPane (outlet) {
  let linkedEditorId = outlet.element.getAttribute('outlet-linked-editor-id')
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

function relocate (outlet, backwards) {
  const allowedLocations = outlet.getAllowedLocations()
  if (allowedLocations.length > 1) {
    const delta = backwards ? -1 : +1
    const index = allowedLocations.indexOf(getLocationForItem(outlet))
    const newIndex = adjustIndexForList(allowedLocations, index + delta)
    const location = allowedLocations[newIndex]

    moveItemToPane(outlet, getPaneForOutlet(outlet, location))
    show(outlet)
  }
}

function show (outlet) {
  atom.workspace.paneForItem(outlet).activateItem(outlet)
  const location = getLocationForItem(outlet)
  if (location !== 'center') {
    getDockForLocation(location).show()
  }
}

function hide (outlet) {
  // HACK: hidding in center is equal to destroy
  // But we want really hide here.
  // So move to dock then hide!
  if (getLocationForItem(outlet) === 'center') {
    outlet.relocate()
  }
  return atom.workspace.hide(outlet)
}

// Avoid using atom.workspace.toggle, since I don't want to auto-focus to pane on show.
function toggle (outlet) {
  hide(outlet) || show(outlet)
}

function focus (outlet) {
  outlet.element.focus()
}

// When outlet was created from an editor.
// Call this function to link outlet to that editor.
// Linked editor will not be hidden while outlet relocation.
// Only editor in center container can be linked.
function link (outlet, editor) {
  if (getLocationForItem(editor) === 'center') {
    outlet.element.setAttribute('outlet-linked-editor-id', editor.id)
  }
}
module.exports = {open, create, relocate, show, hide, toggle, focus, link}
