// Session helpers - store/retrieve auth data from localStorage
export const storeSession = (userData) => {
  localStorage.setItem("seva_token", userData.token);
  localStorage.setItem("seva_user", JSON.stringify({
    id: userData.user?.id || userData.organization?.id,
    name: userData.user?.name || userData.organization?.name,
    email: userData.user?.email || userData.organization?.email,
    role: userData.user?.role || userData.organization?.role || "user",
  }));
};

export const getToken = () => localStorage.getItem("seva_token");

export const getUser = () => {
  try {
    return JSON.parse(localStorage.getItem("seva_user"));
  } catch { return null; }
};

export const isLoggedIn = () => !!getToken();

export const clearSession = () => {
  // Remove all known auth keys from localStorage
  localStorage.removeItem("seva_token");
  localStorage.removeItem("seva_user");
  // Wipe any sessionStorage leftovers so nothing survives the sign-out
  sessionStorage.clear();
};

export const authHeaders = () => ({
  "Content-Type": "application/json",
  "Authorization": `Bearer ${getToken()}`
});
