export const normalizeRole = (role) => (role === "user" || !role ? "customer" : role);

export const getRoleHomePath = (role) => {
  const normalizedRole = normalizeRole(role);
  if (normalizedRole === "admin") return "/admin";
  if (normalizedRole === "deliveryBoy") return "/delivery";
  return "/user/menu";
};
