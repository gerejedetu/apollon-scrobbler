import { Link } from "@tanstack/react-router";
import type { AnchorHTMLAttributes } from "react";

/**
 * The design system draws its links as <a href>. Same-site paths go through the router (no reload, preloading);
 * "#" placeholders and other sites stay plain anchors.
 */
export function A({ href, ...rest }: AnchorHTMLAttributes<HTMLAnchorElement>) {
  if (href && href.startsWith("/") && !href.startsWith("//")) {
    return <Link to={href} {...(rest as object)} />;
  }
  return <a href={href} {...rest} />;
}
