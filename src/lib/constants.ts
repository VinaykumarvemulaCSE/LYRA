export const ADMIN_EMAILS = [
  import.meta.env.VITE_ADMIN_EMAIL || "kumarvinay072007@gmail.com"
];

export const isUserAdmin = (email: string | null | undefined) => {
  if (!email) return false;
  return ADMIN_EMAILS.includes(email);
};
