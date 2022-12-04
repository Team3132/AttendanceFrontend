import { ChakraProvider } from "@chakra-ui/react";
import { QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { AuthWrapper } from "./features/auth";
import {
  AgendaPage,
  Calendar,
  CreateEventPage,
  EditEventPage,
  EventPage,
} from "./features/event";
import { SWToast } from "./features/pwa";
import { ScancodePage } from "./features/scancode";
import { ProfilePage } from "./features/user";
import Layout from "./layouts/Layout";
import AdminPage from "./pages/AdminPage";
import ErrorBoundary from "./screens/ErrorBoundary";
import Home from "./screens/Home";
import queryClient from "./services/queryClient";

ReactDOM.createRoot(document.getElementById("root")!).render(
  // <React.StrictMode>
  <BrowserRouter>
    <ChakraProvider>
      <ErrorBoundary>
        <SWToast />
        <QueryClientProvider client={queryClient}>
          <Routes>
            <Route path="/" element={<Layout />}>
              {/* Public Pages */}
              <Route index element={<Home />} />
              {/* Authenticated-only pages */}
              <Route element={<AuthWrapper />}>
                <Route path="event/:eventId" element={<EventPage />} />
                <Route path="calendar">
                  <Route element={<AgendaPage />} index />
                  <Route path="calendar" element={<Calendar />} />
                  {/* <Route path="custom" element={<CustomCalendar />} /> */}
                </Route>
                <Route element={<ScancodePage />} path="codes" />
                <Route element={<ProfilePage />} path="profile" />
              </Route>
              {/* Admin only pages */}
              <Route element={<AuthWrapper adminOnly />}>
                <Route path="event/create" element={<CreateEventPage />} />
                <Route path="event/:eventId/edit" element={<EditEventPage />} />
                <Route element={<AdminPage />} path="admin" />
                <Route element={<ProfilePage />} path="profile/:userId" />
              </Route>
            </Route>
          </Routes>

          <ReactQueryDevtools />
        </QueryClientProvider>
      </ErrorBoundary>
    </ChakraProvider>
  </BrowserRouter>
  // </React.StrictMode>
);
