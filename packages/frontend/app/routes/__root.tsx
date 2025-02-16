import roboto300 from "@fontsource/roboto/300.css?url";
import robot400 from "@fontsource/roboto/400.css?url";
import roboto500 from "@fontsource/roboto/500.css?url";
import roboto700 from "@fontsource/roboto/700.css?url";
import CssBaseline from "@mui/material/CssBaseline";
import InitColorSchemeScript from "@mui/material/InitColorSchemeScript";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import { LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterLuxon } from "@mui/x-date-pickers/AdapterLuxon";
import {
  type QueryClient,
  keepPreviousData,
  useQuery,
} from "@tanstack/react-query";
import { useRouterState } from "@tanstack/react-router";
import {
  ErrorComponent,
  Outlet,
  createRootRouteWithContext,
} from "@tanstack/react-router";
import { Meta, Scripts } from "@tanstack/start";
import * as React from "react";
import rootCss from "./root.css?inline";

type Awaitable<T> = T | Promise<T>;

export const Route = createRootRouteWithContext<{
  queryClient: QueryClient;
  getTitle?: () => Awaitable<string>;
}>()({
  component: RootComponent,
  head: () => ({
    meta: [
      {
        charSet: "utf-8",
      },
      {
        name: "viewport",
        content: "width=device-width, initial-scale=1",
      },
    ],
    links: [
      {
        rel: "stylesheet",
        href: roboto300,
      },
      {
        rel: "stylesheet",
        href: robot400,
      },
      {
        rel: "stylesheet",
        href: roboto500,
      },
      {
        rel: "stylesheet",
        href: roboto700,
      },
      {
        rel: "icon",
        type: "image/x-icon",
        href: "/favicon.ico",
      },
    ],

    // scripts: import.meta.env.DEV
    //   ? [
    //       {
    //         src: "https://unpkg.com/react-scan/dist/auto.global.js",
    //       },
    //     ]
    //   : undefined,
  }),
  errorComponent: ErrorComponent,
});

const theme = createTheme({
  colorSchemes: {
    dark: true,
    light: true,
  },
  cssVariables: {
    colorSchemeSelector: "data",
  },
});

const TanStackRouterDevtools =
  process.env.NODE_ENV === "production"
    ? () => null // Render nothing in production
    : React.lazy(() =>
        // Lazy load in development
        import("@tanstack/router-devtools").then((res) => ({
          default: res.TanStackRouterDevtools,
          // For Embedded Mode
          // default: res.TanStackRouterDevtoolsPanel
        })),
      );

const TanStackQueryDevtools =
  process.env.NODE_ENV === "production"
    ? () => null // Render nothing in production
    : React.lazy(() =>
        // Lazy load in development
        import("@tanstack/react-query-devtools").then((res) => ({
          default: res.ReactQueryDevtools,
        })),
      );

function RootComponent() {
  return (
    <RootDocument>
      <InitColorSchemeScript attribute="data" />
      <LocalizationProvider adapterLocale={"en-au"} dateAdapter={AdapterLuxon}>
        <ThemeProvider theme={theme}>
          <Outlet />
          <CssBaseline enableColorScheme />
        </ThemeProvider>
      </LocalizationProvider>
      <React.Suspense fallback={null}>
        <TanStackRouterDevtools />
        <TanStackQueryDevtools />
      </React.Suspense>
    </RootDocument>
  );
}

function RootTitle() {
  const matches = useRouterState({ select: (s) => s.matches });

  const getTitleQuery = useQuery({
    queryKey: ["getTitle", matches],
    queryFn: async () => {
      const matchWithTitle = [...matches]
        .reverse()
        .find((d) => d.context.getTitle);

      return matchWithTitle?.context.getTitle
        ? await matchWithTitle?.context.getTitle()
        : "My App";
    },
    placeholderData: keepPreviousData,
  });

  return <title>{getTitleQuery.data || "Loading..."}</title>;
}

function RootDocument({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <Meta />
        <RootTitle />
        <style>{rootCss}</style>
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}
