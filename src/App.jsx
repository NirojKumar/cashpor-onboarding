// Three pages, chosen by the address: /  (candidate forms) · /review  (HRSM, RM / DRM, HO, admin) · /print/:id  (PDF source)
import { lazy, Suspense } from "react";
import { LangProvider } from "./lib/i18n.jsx";
import { ToastProvider } from "./lib/form.jsx";
import { DevEntryProvider } from "./components/DevEntry.jsx";
import { CandidateApp } from "./candidate/CandidateApp.jsx";

const ReviewApp = lazy(() => import("./review/ReviewApp.jsx"));
const PrintView = lazy(() => import("./print/PrintView.jsx"));

export function App() {
  const path = location.pathname;
  if (path.startsWith("/print/")) {
    const q = new URLSearchParams(location.search);
    return (
      <LangProvider initial={q.get("lang") || "hi"} persist={false}>
        <Suspense fallback={null}>
          <PrintView id={path.split("/")[2]} token={q.get("pt")} />
        </Suspense>
      </LangProvider>
    );
  }
  const page = path.startsWith("/review") ? (
    <Suspense fallback={null}>
      <ReviewApp />
    </Suspense>
  ) : (
    <CandidateApp />
  );
  return (
    <LangProvider>
      <ToastProvider>
        <DevEntryProvider>{page}</DevEntryProvider>
      </ToastProvider>
    </LangProvider>
  );
}
