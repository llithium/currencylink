import { useRouteError } from "react-router-dom";

export default function ErrorPage() {
  const error: any = useRouteError();
  console.error(error);

  return (
    <div
      className="signal"
      id="error-page"
      style={{ display: "flex", alignItems: "center", justifyContent: "center" }}
    >
      <div className="signal-glow" />
      <div className="signal-view relative items-center px-6 text-center">
        <span className="signal-diamond" />
        <h1 className="text-[22px] font-bold text-text">Oops!</h1>
        <p className="text-[14px] text-mid">
          Sorry, an unexpected error has occurred.
        </p>
        <p className="mono text-[12px] text-dim">
          {error.statusText || error.message}
        </p>
      </div>
    </div>
  );
}
