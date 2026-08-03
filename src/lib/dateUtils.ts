export function formatRelativeTime(timestamp: number): string {
  const now = Date.now();
  const diffInMs = now - timestamp;
  const diffInSec = Math.floor(diffInMs / 1000);
  const diffInMin = Math.floor(diffInSec / 60);
  const diffInHour = Math.floor(diffInMin / 60);
  const diffInDay = Math.floor(diffInHour / 24);

  if (diffInSec < 45) {
    return 'Baru saja';
  }
  if (diffInMin < 60) {
    return `${diffInMin} menit lalu`;
  }
  if (diffInHour < 24) {
    return `${diffInHour} jam lalu`;
  }
  if (diffInDay === 1) {
    return 'Kemarin';
  }
  if (diffInDay < 7) {
    return `${diffInDay} hari lalu`;
  }

  const d = new Date(timestamp);
  return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
}
