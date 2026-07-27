export const buildMicrosoftAuthUrl = (
  silent = false,
  customReturnUrl = null,
) => {
  const tenantId = import.meta.env.VITE_MICROSOFT_TENANT_ID;
  const clientId = import.meta.env.VITE_MICROSOFT_CLIENT_ID;

  if (!tenantId || !clientId) {
    throw new Error("Variables de entorno para Microsoft no configuradas.");
  }

  const targetRedirect = `${window.location.origin}/login`;
  const redirectUri = encodeURIComponent(targetRedirect);
  const scope = encodeURIComponent("openid profile email User.Read");

  let url = `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/authorize?client_id=${clientId}&response_type=code&redirect_uri=${redirectUri}&response_mode=query&scope=${scope}`;

  if (silent) {
    url += "&prompt=none";
  }

  // Obtiene la ruta destino guardada por PrivateRoute o pasada por parámetro
  const returnTarget = customReturnUrl || sessionStorage.getItem("returnUrl");
  if (returnTarget && returnTarget !== "/login") {
    url += `&state=${encodeURIComponent(returnTarget)}`;
  }

  return url;
};
