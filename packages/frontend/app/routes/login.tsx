import useLogout from "@/hooks/useLogout";
import { authQueryOptions } from "@/queries/auth.queries";
import { Button, Container, Paper, Stack, Typography } from "@mui/material";
import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/login")({
  loader: ({ context: { queryClient } }) => {
    queryClient.prefetchQuery(authQueryOptions.status());
  },
  component: Component,
});

function Component() {
  const authStatusQuery = useSuspenseQuery(authQueryOptions.status());

  const logoutMutation = useLogout();

  return (
    <Container
      sx={{
        display: "flex",
        flexDirection: "column",
        alignContent: "center",
        justifyContent: "center",
        height: "100%",
        overflow: "auto",
      }}
    >
      <Paper
        elevation={3}
        sx={{
          p: 2,
          justifySelf: "center",
        }}
      >
        <Stack gap={2}>
          <Typography variant="h4" textAlign={"center"}>
            Login
          </Typography>
          <Typography variant="body1" textAlign={"center"}>
            In order to use the attendance system, you must login with the same
            discord account that you use for the team Discord server.
          </Typography>
          <Stack gap={2} direction="row" justifyContent="center">
            <Button
              variant="contained"
              color="primary"
              href="/api/auth/discord"
            >
              Login
            </Button>
            {authStatusQuery.data.isAuthenticated ? (
              <Button
                variant="contained"
                color="secondary"
                onClick={() => logoutMutation.mutate()}
              >
                Logout
              </Button>
            ) : null}
          </Stack>
        </Stack>
      </Paper>
    </Container>
  );
}
