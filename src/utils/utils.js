function cleanTrackName (trackName) {
  const substringsToRemove = [
    ' - original mix',
    ' (original mix)',
    ' - original version',
    ' (original version)',
    ' - original',
    ' (original)',
    ' (radio edit)',
    ' - radio edit',
    ' [radio edit]'
  ]
  trackName = trackName.trim().toLowerCase()
  substringsToRemove.forEach(substringToRemove => {
    trackName = trackName.replace(substringToRemove, '')
  })
  trackName = trackName.replace(' (', ' - ').replace(')', '')
  return trackName
}

function removeFeaturedArtistFromName (track) {
  const substringsToRemove = [
    ' - feat. ',
    ' feat. ',
    ' feat.',
    ' feat ',
    ' ft '
  ]
  substringsToRemove.some(substring => {
    const trackNameParts = track.name.split(substring)
    let afterFeatSubstrings = []
    let featuredArtist = ''

    if (trackNameParts.length > 1) {
      afterFeatSubstrings = trackNameParts[1].split(' - ')
      featuredArtist = afterFeatSubstrings[0]
    }

    if (trackNameParts.length > 1 && track.artists.includes(featuredArtist)) {
      track.name = afterFeatSubstrings.length === 1 ? trackNameParts[0] : `${trackNameParts[0]} - ${afterFeatSubstrings[1]}`
      return true
    }
  })
  return track.name
}

function generateRandomString (length) {
  var text = ''
  var possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'

  for (var i = 0; i < length; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length))
  }
  return text
}

function areTracksTheSame (track1, track2) {
  return (tracksHaveSameId() || (tracksHaveSameName() && tracksHaveAtLeastOneCommonArtist()))

  function tracksHaveSameId () {
    return track1.id === track2.id
  }

  function tracksHaveSameName () {
    return track1.name === track2.name
  }

  function tracksHaveAtLeastOneCommonArtist () {
    return track1.artists.some(track1Artist => track2.artists.includes(track1Artist))
  }
}

export {
  cleanTrackName,
  removeFeaturedArtistFromName,
  generateRandomString,
  areTracksTheSame
}
