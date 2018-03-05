const assert = require('assert')
const atomOutlet = require('../lib/index.js')
const {TextEditor, TextBuffer} = require('atom')
const {getLocationForItem} = require('../lib/utils')

const SPECIAL_METHODS = ['open', 'relocate', 'show', 'hide', 'toggle', 'focus', 'toggleFocus', 'link']

describe('atom-outlet library', () => {
  beforeEach(() => {
    workspaceElement = atom.views.getView(atom.workspace)
    document.body.appendChild(workspaceElement)
    document.body.focus()
  })
  afterEach(() => {
    atom.workspace.getTextEditors().forEach(editor => editor.destroy())
    workspaceElement.remove()
  })

  describe('create', () => {
    describe('create without any options', () => {
      it('create instance of TextEditor', () => {
        const outlet = atomOutlet.create()
        assert.equal(outlet instanceof TextEditor, true)
        assert.equal(outlet.getTitle(), 'untitled')
        assert.equal(outlet.element.hasAttribute('outlet'), true)
        assert.equal(outlet.element.hasAttribute('outlet-use-adjacent-pane'), true)
        assert.equal(outlet.element.getAttribute('outlet-split'), 'right')
        outlet.insertText('hello')
        assert.equal(outlet.isModified(), false)
        assert.equal(outlet.getDefaultLocation(), 'bottom')
        assert.deepEqual(outlet.getAllowedLocations(), ['center', 'bottom'])

        atom.commands.dispatch(outlet.element, 'core:close')
        assert.equal(outlet.isDestroyed(), true)
      })
    })

    it('pass through editorOptions to editor creation', () => {
      const buffer = new TextBuffer()
      const outlet = atomOutlet.create({
        editorOptions: {
          buffer: buffer,
          lineNumberGutterVisible: false
        }
      })
      assert.equal(outlet.buffer, buffer)
      assert.equal(outlet.isLineNumberGutterVisible(), false)
    })

    it('keep state as attribute for specific options', () => {
      {
        const outlet = atomOutlet.create({
          split: 'right',
          useAdjacentPane: true
        })
        assert.equal(outlet.element.hasAttribute('outlet-use-adjacent-pane'), true)
        assert.equal(outlet.element.getAttribute('outlet-split'), 'right')
      }

      {
        const outlet = atomOutlet.create({
          split: 'down',
          useAdjacentPane: false
        })
        assert.equal(outlet.element.hasAttribute('outlet-use-adjacent-pane'), false)
        assert.equal(outlet.element.getAttribute('outlet-split'), 'down')
      }
    })

    it('can set misc options, functions', () => {
      const outlet = atomOutlet.create({
        title: 'Hello world',
        classList: ['sample-outlet'],
        defaultLocation: 'bottom',
        allowedLocations: ['center', 'bottom', 'left', 'right']
      })

      assert.equal(outlet.getTitle(), 'Hello world')
      assert.equal(outlet.element.classList.contains('sample-outlet'), true)
      assert.equal(outlet.getDefaultLocation(), 'bottom')
      assert.deepEqual(outlet.getAllowedLocations(), ['center', 'bottom', 'left', 'right'])
    })

    describe('[option] trackModified', () => {
      it('[when true] behave normally, track editor modification', () => {
        const outlet = atomOutlet.create({trackModified: true})
        outlet.insertText('hello')
        assert.equal(outlet.isModified(), true)
      })
      it('[when false] ignore editor modification', () => {
        const outlet = atomOutlet.create({trackModified: false})
        outlet.insertText('hello')
        assert.equal(outlet.isModified(), false)
        outlet.insertText('world')
        assert.equal(outlet.isModified(), false)
      })
    })

    describe('mixis special methods', () => {
      it('add special methods on TextEditor', async () => {
        const outlet = atomOutlet.create({extendsTextEditor: true})
        for (name of SPECIAL_METHODS) {
          assert.equal(outlet.hasOwnProperty(name), true)
          assert.equal(typeof outlet[name] === 'function', true)
        }
      })
    })
  })

  describe('open', () => {
    it('open', async () => {
      const normalEditor = await atom.workspace.open()
      assert.equal(isActiveItem(normalEditor), true)

      const outlet = atomOutlet.create()
      await outlet.open()
      const dock = atom.workspace.getBottomDock()

      // It just show outlet on bottom-dock
      assert.equal(dock.isVisible(), true)
      assert.equal(dock.getActivePaneItem(), outlet)

      // But still keep original active pane
      assert.equal(isActiveItem(outlet), false)
      assert.equal(isActiveItem(normalEditor), true)
    })
  })

  describe('relocate', () => {
    it('relocate', async () => {
      const normalEditor = await atom.workspace.open()
      assert(isActiveItem(normalEditor))

      const outlet = atomOutlet.create()
      await outlet.open()
      const dock = atom.workspace.getBottomDock()

      assert(dock.isVisible())
      assert(dock.getActivePaneItem() === outlet)

      assert(!isActiveItem(outlet))
      assert(isActiveItem(normalEditor))

      outlet.relocate()

      assert(!dock.isVisible())
      assert(!dock.getActivePaneItem())

      assert(!isActiveItem(outlet))
      assert(isActiveItem(normalEditor))

      const [leftPane, rightPane] = atom.workspace.getCenter().getPanes()
      assert(leftPane.getActiveItem() === normalEditor)
      assert(rightPane.getActiveItem() === outlet)

      outlet.relocate()

      assert(dock.isVisible())
      assert(dock.getActivePaneItem() === outlet)
      assert(rightPane.isDestroyed())

      // keep focus
      outlet.focus()
      assert(outlet.element.hasFocus())
      outlet.relocate()
      assert(outlet.element.hasFocus())
      outlet.relocate()
      assert(outlet.element.hasFocus())
    })
  })
  describe('show', () => {
    it('show', async () => {
      const editor1 = await atom.workspace.open()
      const editor2 = await atom.workspace.open(null, {split: 'right'})
      const [leftPane, rightPane] = atom.workspace.getCenter().getPanes()
      leftPane.activate()
      assert(leftPane.getActiveItem() === editor1)
      assert(rightPane.getActiveItem() === editor2)
      assert(editor1.element.hasFocus())

      const outlet1 = atomOutlet.create()
      const outlet2 = atomOutlet.create()
      await outlet1.open()
      await outlet2.open()
      assert(getLocationForItem(outlet1) === 'bottom')
      assert(getLocationForItem(outlet2) === 'bottom')

      const dock = atom.workspace.getBottomDock()
      assert(dock.getActivePaneItem() === outlet2)
      outlet1.show()
      assert(dock.getActivePaneItem() === outlet1)
      assert(editor1.element.hasFocus())

      // Show in center workspace activate outlet on pane
      outlet1.relocate()
      assert(rightPane.getActiveItem() === outlet1)
      rightPane.activateItem(editor2)
      assert(rightPane.getActiveItem() === editor2)
      outlet1.show()
      assert(rightPane.getActiveItem() === outlet1)
      assert(editor1.element.hasFocus()) // still keep focused to original element

      dock.hide()
      assert(!dock.isVisible())
      outlet2.show()
      assert(dock.isVisible())
    })
  })

  describe('hide/show', () => {
    it.only('hide in center', async () => {
      const editor = await atom.workspace.open()
      assert(editor.element.hasFocus())

      const outlet = atomOutlet.create({defaultLocation: 'center'})
      await outlet.open()

      assert(getLocationForItem(outlet) === 'center')
      const [leftPane, rightPane] = atom.workspace.getCenter().getPanes()
      assert(leftPane.getActiveItem() === editor)
      assert(rightPane.getActiveItem() === outlet)

      const dock = atom.workspace.getBottomDock()
      assert(!dock.isVisible())

      // Hide outlet when dock have no item
      outlet.hide()
      assert(!dock.isVisible())
      assert(dock.getActivePaneItem() === outlet)
      assert(getLocationForItem(outlet) === 'bottom')
      assert(outlet.element.hasAttribute('outlet-hidden-in-center'))

      outlet.show()
      assert(!dock.isVisible())
      assert(!dock.getActivePaneItem())
      {
        assert(getLocationForItem(outlet) === 'center')
        const [leftPane, rightPane] = atom.workspace.getCenter().getPanes()
        assert(leftPane.getActiveItem() === editor)
        assert(rightPane.getActiveItem() === outlet)
        assert(!outlet.element.hasAttribute('outlet-hidden-in-center'))
      }

      // Hide outlet when visible dock have another item
      const outlet2 = atomOutlet.create()
      await outlet2.open()
      assert(getLocationForItem(outlet2) === 'bottom')
      assert(dock.isVisible())
      assert(dock.getActivePaneItem() === outlet2)

      outlet.hide()
      assert(getLocationForItem(outlet) === 'bottom')
      assert(dock.isVisible())
      assert(dock.getActivePaneItem() === outlet2)

      outlet.show()
      assert(dock.isVisible())
      assert(dock.getActivePaneItem() === outlet2)
      {
        assert(getLocationForItem(outlet) === 'center')
        const [leftPane, rightPane] = atom.workspace.getCenter().getPanes()
        assert(leftPane.getActiveItem() === editor)
        assert(rightPane.getActiveItem() === outlet)
        assert(!outlet.element.hasAttribute('outlet-hidden-in-center'))
      }

      // Hide outlet when invisible dock have another item
      dock.hide()
      assert(!dock.isVisible())
      assert(dock.getActivePaneItem() === outlet2)

      outlet.hide()
      assert(!dock.isVisible())
      // HACK: Keeping hidden item as active item of dock is intentional.
      // so that `outlet:toggle` can pick latest hidden one first
      assert(dock.getActivePaneItem() === outlet)
    })
  })

  describe('toggle', () => {
    it('open', () => {
      null
    })
  })
  describe('focus', () => {
    it('open', () => {
      null
    })
  })
  describe('toggleFocus', () => {
    it('open', () => {
      null
    })
  })
  describe('link', () => {
    it('open', () => {
      null
    })
  })
})

function isActiveItem (item) {
  return (
    atom.workspace
      .getActivePaneContainer()
      .getActivePane()
      .getActiveItem() === item
  )
}
