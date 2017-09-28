'use babel'

import {CompositeDisposable, Emitter} from 'atom'
import {render, renderString} from 'nunjucks'
import matter from 'gray-matter'

import {OPENER_URI, OUTPUT_ID} from './constants'

export default class PrimerPrototypeView {

  constructor() {
    // Create root element
    this.element = document.createElement('div')
    this.root = this.element.createShadowRoot()

    this.frameTemplate = require.resolve('../templates/frame.html')
    this.templateData = {
      document: {
        stylesheet: require.resolve('primer-css/build/build.css')
      }
    }

    this.root.innerHTML = render(
      require.resolve('../templates/view.html'),
      {OUTPUT_ID}
    )

    // get message and output elements
    this.output = this.root.querySelector(`#${OUTPUT_ID}`)

    this.subscriptions = new CompositeDisposable(
      atom.workspace.getCenter().observeActivePaneItem(item => {
        this.update(item)
      })
    )
  }

  getTitle() {
    return 'Primer Prototype'
  }

  getURI() {
    return OPENER_URI
  }

  getDefaultLocation() {
    return 'right'
  }

  getAllowedLocations() {
    return ['left', 'right']
  }

  update(item) {
    if (!atom.workspace.isTextEditor(item)) {
      this.showMessage('Open a file to prototype with it.')
      return
    }

    const update = () => {
      try {
        const text = item.buffer.getText()
        const {data, content} = matter(text || '')
        const rendered = renderString(content, data)
        this.renderFrame(rendered, data)
      } catch (error) {
        this.showMessage(error.message, 'error')
      }
    }

    update()

    const onChange = item.onDidStopChanging(update)
  }

  renderFrame(content, data) {
    this.output.srcdoc = render(this.frameTemplate, Object.assign(
      {content},
      this.templateData,
      data,
    ))
  }

  showMessage(message, type) {
    this.renderFrame({
      content: `
        <div class="flash flash-${type || 'default'}>
          ${message}
        </div>
      `
    })
  }

  // Returns an object that can be retrieved when package is activated
  serialize() {
  }

  // Tear down any state and detach
  destroy() {
    this.element.remove()
    this.subscriptions.dispose()
  }

  getElement() {
    return this.element
  }

}
