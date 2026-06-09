// Background+border tint classes that flag whether a task is actionable. Merge
// the result into a row's existing layout classes (rounded, border width, etc.).
export function taskTint(actionable: boolean): string {
  return actionable
    ? 'bg-[#EFFDF5] border-[#77DD77]' // green-50 bg / green border — actionable
    : 'bg-[#F4F4F5] border-[#D4D4D8]' // muted gray — non-actionable
}
