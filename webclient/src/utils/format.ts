export function formatCurrency(amount: number | string | null | undefined, currency: string = 'USD'): string {
  if (amount === null || amount === undefined || isNaN(Number(amount))) {
    return '$0.00';
  }
  const num = Number(amount);
  if (currency.toUpperCase() === 'KHR') {
    return new Intl.NumberFormat('km-KH', {
      style: 'currency',
      currency: 'KHR',
      maximumFractionDigits: 0,
    }).format(num);
  }

  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(num);
}

export function formatDate(dateString: string | null | undefined, locale: 'kh' | 'km' | 'en' = 'en'): string {
  if (!dateString) return '-';
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return '-';
    return d.toLocaleDateString(locale === 'kh' || locale === 'km' ? 'km-KH' : 'en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return dateString;
  }
}

export function formatDateTime(dateString: string | null | undefined): string {
  if (!dateString) return '-';
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return '-';
    return d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return dateString;
  }
}
