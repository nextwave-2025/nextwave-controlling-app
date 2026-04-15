export function getTodayRange() {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
  const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
  return { start, end };
}

export function getMonthRange(date = new Date()) {
  const start = new Date(date.getFullYear(), date.getMonth(), 1, 0, 0, 0, 0);
  const end = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);
  return { start, end };
}

export function getQuarterRange(date = new Date()) {
  const quarterStartMonth = Math.floor(date.getMonth() / 3) * 3;
  const start = new Date(date.getFullYear(), quarterStartMonth, 1, 0, 0, 0, 0);
  const end = new Date(date.getFullYear(), quarterStartMonth + 3, 0, 23, 59, 59, 999);
  return { start, end };
}

export function isDateActiveInMonth(
  startDate: Date | null,
  endDate: Date | null,
  monthStart: Date,
  monthEnd: Date
) {
  const startsBeforeEnd = !startDate || startDate <= monthEnd;
  const endsAfterStart = !endDate || endDate >= monthStart;
  return startsBeforeEnd && endsAfterStart;
}