import { isRouteErrorResponse, Link, useRouteError } from "react-router-dom";

export default function ErrorPage() {
  const error = useRouteError();
  const message = isRouteErrorResponse(error)
    ? error.statusText || `Request failed with status ${error.status}`
    : error instanceof Error
      ? error.message
      : "An unexpected error occurred.";

  return (
    <div className="error-page">
      <div className="ambient-glow" aria-hidden="true" />
      <div className="error-card panel" role="alert">
        <span className="brand-mark" aria-hidden="true" />
        <p className="eyebrow">Currency Link</p>
        <h1>Rates are unavailable</h1>
        <p>{message}</p>
        <div className="error-actions">
          <button type="button" className="primary-button" onClick={() => window.location.reload()}>
            Try again
          </button>
          <Link className="text-button" to="/">Return home</Link>
        </div>
      </div>
    </div>
  );
}
