"use client";

import { usePathname as useNextPathname } from "next/navigation";
import * as React from "react";

import { buildHref, resolveHref } from "@/lib/navigation/paths";

export type AppLinkProps = Omit<
  React.AnchorHTMLAttributes<HTMLAnchorElement>,
  "href"
> & {
  /** TanStack-style path (`/signin`) or approved Next path (`/auth/sign-in`). */
  to?: string;
  href?: string;
  params?: Record<string, string>;
  search?: Record<string, string | undefined | null>;
  hash?: string;
  replace?: boolean;
  children?: React.ReactNode;
};

/**
 * Framework-agnostic link: plain anchor with runtime path resolution.
 * Works in both TanStack (Vite) and Next during dual in-repo coexistence.
 */
export const Link = React.forwardRef<HTMLAnchorElement, AppLinkProps>(
  function AppLink(
    { to, href, params, search, hash, replace, children, onClick, ...rest },
    ref,
  ) {
    let target = buildHref(href ?? to ?? "/", { params, search });
    if (hash) {
      const h = hash.startsWith("#") ? hash : `#${hash}`;
      target = `${target}${h}`;
    }

    return (
      <a
        ref={ref}
        href={target}
        {...rest}
        onClick={(event) => {
          onClick?.(event);
          if (event.defaultPrevented || !replace) return;
          if (
            event.button !== 0 ||
            event.metaKey ||
            event.altKey ||
            event.ctrlKey ||
            event.shiftKey
          ) {
            return;
          }
          event.preventDefault();
          window.location.replace(target);
        }}
      >
        {children}
      </a>
    );
  },
);

export type NavigateOptions = {
  to?: string;
  params?: Record<string, string>;
  search?: Record<string, string | undefined | null>;
  replace?: boolean;
  /** Ignored on Next (no history state); prefer search params. */
  state?: unknown;
};

export function useNavigate() {
  return React.useCallback((opts: NavigateOptions | string) => {
    const options =
      typeof opts === "string" ? ({ to: opts } satisfies NavigateOptions) : opts;
    const base =
      options.to ??
      (typeof window !== "undefined" ? window.location.pathname : "/");
    const url = buildHref(base, {
      params: options.params,
      search: options.search,
    });
    if (options.replace) {
      window.location.replace(url);
    } else {
      window.location.assign(url);
    }
  }, []);
}

function useWindowPathname(): string {
  const [pathname, setPathname] = React.useState(() =>
    typeof window !== "undefined" ? window.location.pathname : "",
  );

  React.useEffect(() => {
    const sync = () => setPathname(window.location.pathname);
    sync();
    window.addEventListener("popstate", sync);
    return () => window.removeEventListener("popstate", sync);
  }, []);

  return pathname;
}

/** Next: SSR-safe pathname from App Router. TanStack: window + popstate. */
export const usePathname =
  process.env.NEXT_PUBLIC_IS_NEXT === "1" ? useNextPathname : useWindowPathname;

/** Compatibility shim for `useRouterState({ select: s => s.location.pathname })`. */
export function useRouterState<T>(options: {
  select: (state: { location: { pathname: string } }) => T;
}): T {
  const pathname = usePathname();
  return options.select({ location: { pathname } });
}

export { resolveHref, buildHref };
