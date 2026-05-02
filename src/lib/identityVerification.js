export function isIdentityVerified(entity) {
  if (!entity) return false;
  return (
    Number(entity.identity_verified) === 1 ||
    Number(entity.seller_identity_verified) === 1 ||
    Number(entity.reviewer_identity_verified) === 1 ||
    entity.identity_status === 'approved' ||
    Boolean(entity.identity_verified_at)
  );
}
