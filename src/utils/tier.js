// Helpers for the contributor tier badge (Tier 0 - Tier 10, or "faculty").
// The backend sends tier keys such as "tier3"; see config/reviewerhub.php -> tiers.

export const tierNumber = (key) => {
  const match = /^tier(\d+)$/.exec(key || '');
  return match ? Number(match[1]) : null;
};

export const tierLabel = (key) => {
  if (key === 'faculty') return 'Faculty';
  const number = tierNumber(key);
  return number === null ? 'Tier 0' : `Tier ${number}`;
};

// "3-page preview" / "Full preview"
export const previewLabel = (tier) =>
  tier?.previewPages == null ? 'Full preview' : `${tier.previewPages}-page preview`;

// "Downloads locked" / "2 of 3 downloads left this month" / "Unlimited downloads"
export const downloadsLabel = (tier) => {
  if (!tier) return '';
  if (tier.downloadsPerMonth == null) return 'Unlimited downloads';
  if (tier.downloadsPerMonth === 0) return 'Downloads locked';
  return `${tier.downloadsLeft} of ${tier.downloadsPerMonth} downloads left this month`;
};