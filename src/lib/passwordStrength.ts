export function getPasswordStrength(pw: string): { label: string; color: string; percent: number } {
  let score = 0;
  if (pw.length >= 8) score++;
  if (pw.length >= 12) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;

  if (score <= 1) return { label: 'Weak', color: 'bg-red-500', percent: 20 };
  if (score <= 2) return { label: 'Fair', color: 'bg-yellow-500', percent: 40 };
  if (score <= 3) return { label: 'Good', color: 'bg-blue-500', percent: 60 };
  if (score <= 4) return { label: 'Strong', color: 'bg-green-500', percent: 80 };
  return { label: 'Very strong', color: 'bg-green-400', percent: 100 };
}
