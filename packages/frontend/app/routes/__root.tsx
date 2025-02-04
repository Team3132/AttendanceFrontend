import roboto300 from "@fontsource/roboto/300.css?url";
import robot400 from "@fontsource/roboto/400.css?url";
import roboto500 from "@fontsource/roboto/500.css?url";
import roboto700 from "@fontsource/roboto/700.css?url";
import { CssBaseline, ThemeProvider, createTheme } from "@mui/material";
import InitColorSchemeScript from "@mui/material/InitColorSchemeScript";
import { LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterLuxon } from "@mui/x-date-pickers/AdapterLuxon";
import type { QueryClient } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import {
  ErrorComponent,
  Outlet,
  createRootRouteWithContext,
} from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/router-devtools";
import { Meta, Scripts } from "@tanstack/start";
import type * as React from "react";

export const Route = createRootRouteWithContext<{
  queryClient: QueryClient;
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
      {
        title: "TDU Attendance System",
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

function RootComponent() {
  return (
    <RootDocument>
      <InitColorSchemeScript attribute="data" />
      <LocalizationProvider adapterLocale={"en-au"} dateAdapter={AdapterLuxon}>
        <ThemeProvider theme={theme}>
          <Outlet />
          <CssBaseline />
        </ThemeProvider>
      </LocalizationProvider>
    </RootDocument>
  );
}

function RootDocument({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <Meta />
        <style>
          {`html, body, #root {
  margin: 0;
  padding: 0;
  height: 100%;
  width: 100%;
}
`}
        </style>
      </head>
      <body>
        {children}
        {import.meta.env.DEV ? (
          <>
            <TanStackRouterDevtools position="bottom-right" />
            <ReactQueryDevtools buttonPosition="bottom-left" />
          </>
        ) : null}

        <Scripts />
      </body>
    </html>
  );
}
