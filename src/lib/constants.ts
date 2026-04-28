
export const ADMIN_EMAILS = [
  'web20100101@gmail.com',
  'admin@example.com',
  'guest@example.com'
];

export const ADMIN_UIDS = [
  'zygdLwQD7vZp1J8Ru4nMvv65gf82'
];

export const isAdmin = (email: string | null | undefined, uid: string | null | undefined) => {
  if (!email && !uid) return false;
  return (email && ADMIN_EMAILS.includes(email)) || (uid && ADMIN_UIDS.includes(uid));
};
