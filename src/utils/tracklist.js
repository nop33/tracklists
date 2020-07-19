import { origins } from './constants'

class TracklistBase {
  id = ''
  name = ''
  contentType = ''
  tracks = []
  origin = ''

  constructor (id, name, contentType, tracks) {
    this.id = id
    this.name = name
    this.contentType = contentType
    this.tracks = tracks
  }
}

class ImportedTracklist extends TracklistBase {
  constructor (id, name, contentType, tracks = []) {
    super(id, name, contentType, tracks)
    this.origin = origins.IMPORTED
  }
}

class GeneratedTracklist extends TracklistBase {
  constructor (id, name, contentType, tracks = []) {
    super(id, name, contentType, tracks)
    this.origin = origins.GENERATED
  }
}

export {
  TracklistBase,
  ImportedTracklist,
  GeneratedTracklist
}
