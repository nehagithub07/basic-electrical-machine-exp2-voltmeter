const toFiniteNumber = (value) => {
  const number = Number(value)

  return Number.isFinite(number) ? number : 0
}

export const calculateReadings = ({ voltage, r1, r2, r3 }) => {
  const powerSupply = Math.max(toFiniteNumber(voltage), 0)
  // Resistance controls are expressed in kΩ; circuit calculations use Ω and A.
  const r1Value = Math.max(toFiniteNumber(r1) * 1000, 0)
  const r2Value = Math.max(toFiniteNumber(r2) * 1000, 0)
  const r3Value = Math.max(toFiniteNumber(r3) * 1000, 0)
  const branchResistance = r2Value + r3Value
  const parallelResistance = branchResistance > 0
    ? (r2Value * r3Value) / branchResistance
    : 0
  const totalResistance = r1Value + parallelResistance
  const i1 = totalResistance > 0 ? powerSupply / totalResistance : 0
  const i2 = branchResistance > 0 ? (r3Value / branchResistance) * i1 : 0
  const i3 = branchResistance > 0 ? (r2Value / branchResistance) * i1 : 0
  const v1 = i1 * r1Value
  const v2 = i2 * r2Value
  const v3 = i3 * r3Value

  return {
    totalResistance,
    i1,
    i2,
    i3,
    v1,
    v2,
    v3,
  }
}
