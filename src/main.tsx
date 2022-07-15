import { ChakraProvider } from "@chakra-ui/react";
import { Provider as AlertProvider } from "react-alert";
import "react-big-calendar/lib/css/react-big-calendar.css";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { SWRConfig } from "swr";
import { ChakraAlert, CreateEventDrawer } from "./components";
import { AuthWrapper } from "./components/AuthWrapper";
import { fetcher } from "./hooks";
import {
  Agenda,
  Calendar,
  EventDetailsScreen,
  EventEditScreen,
  Home,
  Layout,
  Profile,
  ScancodeScreen,
  ScaninScreen,
} from "./loadables";
ReactDOM.createRoot(document.getElementById("root")!).render(
  // <React.StrictMode>
  <ChakraProvider>
    <SWRConfig
      value={{
        fetcher,
        onError: (error) => {
          console.log("This is an error", error);
        },
      }}
    >
      <AlertProvider template={ChakraAlert}>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Layout />}>
              <Route index element={<Home />} />
              <Route path="event/:eventId">
                <Route
                  path="edit"
                  element={
                    <AuthWrapper adminOnly>
                      <EventEditScreen />
                    </AuthWrapper>
                  }
                />
                <Route path="view" element={<EventDetailsScreen />} />
                <Route path="scanin" element={<ScaninScreen />} />
              </Route>
              <Route
                path="calendar/agenda"
                element={
                  <AuthWrapper>
                    <Agenda />
                  </AuthWrapper>
                }
              />
              <Route
                element={
                  <AuthWrapper>
                    <Calendar />
                  </AuthWrapper>
                }
                path="calendar"
              >
                <Route path="create" element={<CreateEventDrawer />} />
              </Route>
              <Route
                element={
                  <AuthWrapper>
                    <ScancodeScreen />
                  </AuthWrapper>
                }
                path="codes"
              />
              <Route
                element={
                  <AuthWrapper>
                    <Profile />
                  </AuthWrapper>
                }
                path="profile"
              />
              <Route
                element={
                  <AuthWrapper adminOnly>
                    <Profile />
                  </AuthWrapper>
                }
                path="profile/:userId"
              />
            </Route>
          </Routes>
        </BrowserRouter>
      </AlertProvider>
    </SWRConfig>
  </ChakraProvider>
  // </React.StrictMode>
);
