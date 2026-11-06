import { notFound } from "next/navigation";

// Target of the proxy for unknown localized paths: renders the localized not-found page with a 404 status.
export default function UnknownPath() {
  notFound();
}
