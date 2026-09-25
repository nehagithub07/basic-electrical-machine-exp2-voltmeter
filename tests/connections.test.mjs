import assert from 'node:assert/strict'
import test from 'node:test'
import {
  DEFAULT_AUTO_CONNECTIONS,
  getConnectionStatus,
  getNextRequiredConnectionPair,
  getVoltmeterReadingKeys,
} from '../src/utils/jsPlumbWiring.js'
import { getConnectionFeedback } from '../src/utils/connectionFeedback.js'

const endpoint = (number) => `${number}-endpoint`
const circuit = (pairs) => ({
  getAllConnections: () => pairs.map(([sourceId, targetId]) => ({ sourceId, targetId })),
})
const numberedCircuit = (pairs) => circuit(pairs.map((pair) => pair.map(endpoint)))

test('empty wiring suggests three correct connections', () => {
  const result = getConnectionStatus(circuit([]))
  assert.equal(result.isCorrect, false)
  assert.equal(result.missingConnections.length, 8)
  assert.equal(getConnectionFeedback(result), [
    'No connections have been made yet.',
    'Next missing connections (8 remaining):\nTerminal 1 → terminal 9\nTerminal 2 → terminal 10\nTerminal 3 → terminal 11',
    'Click Check again after correcting the wiring.',
  ].join('\n\n'))
})

test('one or two correct wires are reported as correct with missing connections', () => {
  for (const count of [1, 2]) {
    const result = getConnectionStatus(circuit(DEFAULT_AUTO_CONNECTIONS.slice(0, count)))
    assert.equal(result.hasInvalidConnection, false)
    assert.equal(result.correctConnections.length, count)
    assert.equal(result.missingConnections.length, 8 - count)
    assert.match(getConnectionFeedback(result), /Correct connections:\nTerminal 1 → terminal 9/)
    const suggestions = getConnectionFeedback(result).split('remaining):\n')[1].split('\n\n')[0]
    assert.equal(suggestions.split('\n').length, 3)
  }
})

test('wrong, correct, and missing wires appear together with relevant corrections', () => {
  const result = getConnectionStatus(numberedCircuit([[1, 9], [3, 12], [5, 16]]))
  const feedback = getConnectionFeedback(result)
  assert.equal(result.invalidConnectionCount, 2)
  assert.match(feedback, /Wrong connections:\nTerminal 3 → terminal 12\nTerminal 5 → terminal 16/)
  assert.match(feedback, /Correct connections:\nTerminal 1 → terminal 9/)
  assert.match(feedback, /Next missing connections \(7 remaining\):\nTerminal 2 → terminal 10\nTerminal 3 → terminal 11\nTerminal 4 → terminal 12/)
})

test('the wrong-connection example matches the requested alert copy and order', () => {
  const result = getConnectionStatus(numberedCircuit([[1, 11]]))
  assert.equal(getConnectionFeedback(result), [
    'Wrong connections:\nTerminal 1 → terminal 11',
    'Click the terminal number to remove each wrong wire.',
    'Next missing connections (8 remaining):\nTerminal 1 → terminal 9\nTerminal 2 → terminal 10\nTerminal 3 → terminal 11',
    'Click Check again after correcting the wiring.',
  ].join('\n\n'))
})

test('reversed drag direction is accepted', () => {
  assert.equal(getConnectionStatus(circuit(DEFAULT_AUTO_CONNECTIONS.map(([a, b]) => [b, a]))).isCorrect, true)
})

test('all valid meter permutations and every partial subset remain valid', () => {
  for (const order of [[0, 1, 2], [0, 2, 1], [1, 0, 2], [1, 2, 0], [2, 0, 1], [2, 1, 0]]) {
    const pairs = [[1, 9], [2, 10], ...order.flatMap((branch, meter) => [
      [3 + 2 * meter, 11 + 2 * branch],
      [4 + 2 * meter, 12 + 2 * branch],
    ])].map((pair) => pair.map(endpoint))
    for (let mask = 0; mask < 256; mask += 1) {
      const subset = pairs.filter((_, index) => mask & (1 << index))
      const instance = circuit(subset)
      const result = getConnectionStatus(instance)
      assert.equal(result.hasInvalidConnection, false)
      assert.equal(result.correctConnections.length, subset.length)
      assert.equal(result.missingConnections.length, 8 - subset.length)
      assert.equal(result.isCorrect, subset.length === 8)
      assert.deepEqual(getNextRequiredConnectionPair(instance), result.missingConnections[0] ?? null)
    }
    assert.deepEqual(getVoltmeterReadingKeys(circuit(pairs)), {
      V1: `v${order[0] + 1}`, V2: `v${order[1] + 1}`, V3: `v${order[2] + 1}`,
    })
  }
})

test('leads spanning different resistor branches require correction', () => {
  const result = getConnectionStatus(numberedCircuit([[1, 9], [2, 10], [3, 11], [4, 14]]))
  assert.equal(result.hasInvalidConnection, true)
  assert.deepEqual(result.invalidConnections, [[endpoint(4), endpoint(14)]])
  assert.deepEqual(result.missingConnections[0], [endpoint(4), endpoint(12)])
})

test('the final missing connection is shown without invented suggestions', () => {
  const result = getConnectionStatus(circuit(DEFAULT_AUTO_CONNECTIONS.slice(0, -1)))
  assert.match(getConnectionFeedback(result), /Next missing connections \(1 remaining\):\nTerminal 8 → terminal 16/)
})

test('duplicate or extra wrong wires prevent verification', () => {
  for (const extra of [DEFAULT_AUTO_CONNECTIONS[0], [endpoint(3), endpoint(12)]]) {
    const result = getConnectionStatus(circuit([...DEFAULT_AUTO_CONNECTIONS, extra]))
    assert.equal(result.isCorrect, false)
    assert.equal(result.invalidConnectionCount, 1)
  }
})
