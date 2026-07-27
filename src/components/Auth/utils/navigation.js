/**
 * Obtiene la ruta a la que el usuario intentaba acceder antes de ser enviado al login.
 * Revisa en orden de prioridad:
 * 1. Parámetro 'state' retornado por Microsoft OAuth.
 * 2. Estado interno de React Router (location.state).
 * 3. Banderas almacenadas en sessionStorage.
 */
export const getReturnUrl = (location) => {
  if (typeof window === "undefined") return "/inicio";

  const urlParams = new URLSearchParams(window.location.search);
  const stateParam = urlParams.get("state");

  const statePath = location?.state?.from
    ? location.state.from.pathname + (location.state.from.search || "")
    : null;

  const savedUrl = sessionStorage.getItem("returnUrl");

  const target = stateParam || statePath || savedUrl || "/inicio";

  // Previene bucles si la ruta resultante es por error /login
  return target === "/login" ? "/inicio" : target;
};
