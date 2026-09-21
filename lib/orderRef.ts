export function formatOrderReference(sessionId: string): string {
  const stripped = sessionId.replace(/^cs_(test|live)_/, '');
  return `Order No.${stripped.slice(-5).toUpperCase()}`;
}
