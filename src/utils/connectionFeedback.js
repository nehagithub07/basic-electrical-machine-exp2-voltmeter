const formatPair = (pair) => {
  const [source, target] = pair
    .map((id) => id.replace('-endpoint', ''))
    .sort((first, second) => Number(first) - Number(second))

  return `Terminal ${source} → terminal ${target}`
}

export const getConnectionFeedback = ({
  correctConnections = [],
  invalidConnections = [],
  missingConnections = [],
}) => {
  const paragraphs = []
  if (invalidConnections.length) {
    paragraphs.push(`Wrong connections:\n${invalidConnections.map(formatPair).join('\n')}`)
    paragraphs.push('Click the terminal number to remove each wrong wire.')
  } else if (correctConnections.length === 0) {
    paragraphs.push('No connections have been made yet.')
  }

  if (correctConnections.length) {
    paragraphs.push(`Correct connections:\n${correctConnections.map(formatPair).join('\n')}`)
  }
  if (missingConnections.length) {
    paragraphs.push(`Next missing connections (${missingConnections.length} remaining):\n${missingConnections.slice(0, 3).map(formatPair).join('\n')}`)
  }
  paragraphs.push('Click Check again after correcting the wiring.')

  return paragraphs.join('\n\n')
}
