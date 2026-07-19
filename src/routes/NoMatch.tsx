import { Link } from "react-router-dom";

export default function NoMatch() {
  return (
    <section className="not-found" aria-labelledby="not-found-title">
      <p className="not-found-code">404</p>
      <h1 id="not-found-title">That rate took a wrong turn.</h1>
      <p>The page you requested doesn’t exist.</p>
      <Link className="primary-button" to="/">Back to converter</Link>
    </section>
  );
}
