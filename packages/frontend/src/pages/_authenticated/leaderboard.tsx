import { Outlet, createFileRoute } from "@tanstack/react-router";
import { createColumnHelper } from "@tanstack/table-core";
import { Duration } from "luxon";
import type { LeaderBoardUser as LeaderboardUserSchema } from "backend/schema";
import { z } from "zod";
import { trpc } from "@/trpcClient";
import { useMemo } from "react";
import { Container, Paper, Stack, Typography } from "@mui/material";
import Datatable from "@/components/DataTable";
import DefaultAppBar from "@/components/DefaultAppBar";

type LeaderboardUser = z.infer<typeof LeaderboardUserSchema>;

const columnHelper = createColumnHelper<LeaderboardUser>();

const roundDuration = (duration: Duration) => {
  const millis = duration.toMillis();
  // round to the nearest minute
  const rounded = Math.round(millis / 60000) * 60000;
  const hours = Math.floor(rounded / 3600000);
  const minutes = Math.floor((rounded % 3600000) / 60000);
  return Duration.fromObject({ hours, minutes });
};

const columns = [
  columnHelper.accessor("rank", {
    header: "Rank",
    maxSize: 50,
  }),
  columnHelper.accessor("username", {
    header: "Username",
  }),
  columnHelper.accessor("duration", {
    header: "Outreach Hours",
    cell: (props) => {
      return roundDuration(Duration.fromISO(props.getValue())).toHuman();
    },
  }),
];

export const Route = createFileRoute("/_authenticated/leaderboard")({
  component: Component,
});

function Component() {
  const leaderboardQuery = trpc.outreach.outreachLeaderboard.useInfiniteQuery(
    {
      limit: 10,
    },
    {
      getNextPageParam: (lastPage) => lastPage.nextPage,
    },
  );

  const flatResults = useMemo(
    () => leaderboardQuery.data?.pages.flatMap((page) => page.items),
    [leaderboardQuery.data],
  );

  const totalRowCount = useMemo(
    () => leaderboardQuery.data?.pages.at(-1)?.total ?? 0,
    [leaderboardQuery.data],
  );

  if (leaderboardQuery.data) {
    return (
      <>
        <DefaultAppBar title="Leaderboards" />
        <Container
          sx={{
            my: 2,
            flexGrow: 1,
          }}
        >
          <Stack gap={2} sx={{ height: "100%", display: "flex" }}>
            <Typography variant="h4">Outreach Leaderboard</Typography>
            <Datatable
              columns={columns ?? []}
              data={flatResults ?? []}
              totalDBRowCount={totalRowCount}
              fetchNextPage={leaderboardQuery.fetchNextPage}
              isFetching={leaderboardQuery.isFetching}
              sx={{
                flex: 1,
                overflowY: "scroll",
              }}
              fixedHeight={53}
            />
          </Stack>
        </Container>
      </>
    );
  }

  return <Typography variant="h4">Loading...</Typography>;
}
