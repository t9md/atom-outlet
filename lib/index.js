module.exports = class Outlet {
  constructor (item) {
    if (atom.workspace.isTextEditor(item)) {
      item.element.classList.add('relocatable')
    }

    this.item = item
  }

  // Options are
  //  * `split` Either 'left', 'right', 'up' or 'down'. This option is used only when location is 'center'.
  //  * `where`: One of
  //    * one of ["center-up", "center-down", "center-left", "center-right", "dock-left", "dock-right", "dock-bottom"]
  //  * `useAdjacentPane`: Used when location is `center`
  //     If true, before trying to split pane find Deafult `true`
  //  * `activatePane` A {Boolean} indicating whether to call {Pane::activate} on
  //    containing pane. Defaults to `false`.
  // Returns a {Promise} that resolves to the passed item(useless!)
  async open (options = {}) {
    this.lastOpenOptions = options
    const {where, useAdjacentPane = true, activatePane = false} = options
    const [dockOrCenter, direction] = where.split('-')
    this.lastOpenOptions = {useAdjacentPane, split: direction, activatePane}
    if (dockOrCenter === 'center') {
      const basePane = atom.workspace.getCenter().getActivePane()
      const pane = getCenterPaneToOpenItem(basePane, this.lastOpenOptions)
      await atom.workspace.open(this.item, {activatePane, pane})
    } else if (dockOrCenter === 'dock') {
      await atom.workspace.open(this.item, {location: direction, activatePane})
      getDockForLocation(direction).show()
    }
    return this.item
  }

  isActiveItem () {
    return (
      atom.workspace
        .getActivePaneContainer()
        .getActivePane()
        .getActiveItem() === this.item
    )
  }

  getPane () {
    return atom.workspace.paneForItem(this.item)
  }

  getLocation () {
    return this.getPane()
      .getContainer()
      .getLocation()
  }

  getLocationInDirection (direction) {
    if (!this.item.getAllowedLocations) return

    const allowedLocations = this.item.getAllowedLocations()
    if (!allowedLocations.length) {
      return
    }

    let index = allowedLocations.indexOf(this.getLocation())
    if (index == -1) {
      index = 0
    }

    if (direction === 'next') {
      index = getValidIndexForList(allowedLocations, index + 1)
    } else if (direction === 'previous') {
      index = getValidIndexForList(allowedLocations, index - 1)
    }

    return allowedLocations[index]
  }

  relocate (direction = 'next') {
    const location = this.getLocationInDirection(direction)
    const isActive = this.isActiveItem()

    let destinationPane
    if (location === 'center') {
      const basePane = atom.workspace.getCenter().getActivePane()
      destinationPane = getCenterPaneToOpenItem(basePane, this.lastOpenOptions)
    } else {
      const dock = getDockForLocation(location)
      dock.show()
      destinationPane = dock.getActivePane()
    }

    this.getPane().moveItemToPane(this.item, destinationPane)
    destinationPane.activateItem(this.item)
    if (isActive) {
      destinationPane.activate()
    }
  }

  hide () {
    if (this.isAlive()) {
      atom.workspace.hide(this.item)
    }
  }

  toggle () {
    if (this.isAlive()) {
      atom.workspace.toggle(this.item)
    }
  }

  activate () {
    if (this.isAlive()) {
      this.getPane().activateItem(this.item)
      if (this.getLocation() !== 'center') {
        getDockForLocation(this.getLocation()).show()
      }
    }
  }

  isAlive () {
    return !this.destroyed && this.item && this.item.isAlive()
  }

  destroy () {
    if (this.isAlive()) {
      this.destroyed = true
      if (this.item.isAlive()) {
        this.item.destroy()
      }
    }
  }
}

function getAdjacentPane (basePane) {
  const parent = basePane.getParent()
  if (parent && parent.getChildren) {
    const children = parent.getChildren()
    const index = children.indexOf(basePane)

    for (const offset of [+1, -1]) {
      const pane = children[index + offset]
      if (pane && pane.constructor.name === 'Pane') {
        return pane
      }
    }
  }
}

function splitPane (pane, direction) {
  switch (direction) {
    case 'left':
      return pane.splitLeft()
    case 'right':
      return pane.splitRight()
    case 'up':
      return pane.splitUp()
    case 'down':
      return pane.splitDown()
  }
}

function getDockForLocation (location) {
  switch (location) {
    case 'left':
      return atom.workspace.getLeftDock()
    case 'right':
      return atom.workspace.getRightDock()
    case 'bottom':
      return atom.workspace.getBottomDock()
  }
}

function getCenterPaneToOpenItem (basePane, {useAdjacentPane, split, activatePane}) {
  const currentActivePane = atom.workspace.getActivePane()
  if (basePane.getContainer().getLocation() !== 'center') {
    throw new Error('Cannot open item in center location from non-center basePane')
  }

  if (useAdjacentPane) {
    let pane = getAdjacentPane(basePane)
    if (pane) {
      return pane
    }
  }

  const pane = splitPane(basePane, split)
  console.log({pane, split})
  if (!activatePane) {
    currentActivePane.activate()
  }
  return pane
}

function getValidIndexForList (list, index) {
  const length = list.length
  if (length === 0) return -1

  index = index % length
  return index >= 0 ? index : length + index
}
