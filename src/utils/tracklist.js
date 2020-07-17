import { origins } from './constants'

class Tracklist {
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

class ImportedTracklist extends Tracklist {
  constructor (id, name, contentType, tracks = []) {
    super(id, name, contentType, tracks)
    this.origin = origins.IMPORTED
  }
}

class GeneratedTracklist extends Tracklist {
  constructor (id, name, contentType, tracks = []) {
    super(id, name, contentType, tracks)
    this.origin = origins.GENERATED
  }
}

export {
  ImportedTracklist,
  GeneratedTracklist
}
