import { t } from "../trpc";
import { sessionProcedure } from "../trpc/utils";
import { getBuildPoints, getOutreachTime } from "../services/outreach.service";
import { OutreachTimeSchema } from "../schema/OutreachTimeSchema";
import { PagedLeaderboardSchema } from "../schema/PagedLeaderboardSchema";
import { PagedBuildPointUsersSchema } from "../schema/PagedBuildPointUsersSchema";

export const outreachRouter = t.router({
  outreachLeaderboard: sessionProcedure
    .input(OutreachTimeSchema)
    .output(PagedLeaderboardSchema)
    .query(({ input }) => getOutreachTime(input)),
  buildPointsLeaderboard: sessionProcedure
    .input(OutreachTimeSchema)
    .output(PagedBuildPointUsersSchema)
    .query(({ input }) => getBuildPoints(input)),
});
