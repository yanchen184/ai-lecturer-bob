const MONTHS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

export function formatDate(d: string): string {
  const [y, m, day] = d.split('-');
  const idx = parseInt(m, 10) - 1;
  return `${MONTHS[idx] ?? m} ${parseInt(day, 10)}, ${y}`;
}
