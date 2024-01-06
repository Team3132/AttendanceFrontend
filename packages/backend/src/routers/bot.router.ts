import { z } from "zod";
import { t } from "../trpc";
import { tokenProcedure } from "../trpc/utils";
import { getBuildPoints, getOutreachTime } from "../services/outreach.service";
import {
  editUserRsvpStatus,
  getAutocompleteEvents,
  getEvent,
  getEventRsvps,
  getEventSecret,
  getNextEvents,
  selfCheckin,
  userCheckout,
} from "../services/events.service";
import { EventsArraySchema } from "../schema/EventsArraySchema";
import {
  AddBuildPointsUserSchema,
  EditRSVPUserSchema,
  EventSchema,
  RSVPSchema,
  RSVPUserSchema,
  SecretOutputSchema,
  UserCheckoutSchema,
  UserCreateSchema,
  UserSchema,
} from "../schema";
import { addUserBuildPoints, createUser } from "../services/user.service";
import { SelfCheckinWithUserId } from "../schema/SelfCheckinWithUserId";
import { OutreachTimeSchema } from "../schema/OutreachTimeSchema";
import { PagedLeaderboardSchema } from "../schema/PagedLeaderboardSchema";
import { BuildPointSchema } from "../schema/BuildPointSchema";
import { PagedBuildPointUsersSchema } from "../schema/PagedBuildPointUsersSchema";

/**
 * A router than the bot uses to communicate with the backend
 */
export const botRouter = t.router({
  online: tokenProcedure
    .input(z.void())
    .output(z.literal("OK"))
    .query(() => "OK"),
  outreachLeaderboard: tokenProcedure
    .input(OutreachTimeSchema)
    .output(PagedLeaderboardSchema)
    .query(({ input }) => getOutreachTime(input)),
  getEventsInNextDay: tokenProcedure
    .input(z.void())
    .output(EventsArraySchema)
    .query(() => getNextEvents()),
  checkout: tokenProcedure
    .input(UserCheckoutSchema)
    .mutation(({ input }) => userCheckout(input.userId, input.eventId)),
  getEventRsvps: tokenProcedure
    .input(z.string())
    .output(z.array(RSVPUserSchema))
    .query(({ input }) => getEventRsvps(input)),
  getEventDetails: tokenProcedure
    .input(z.string())
    .output(EventSchema)
    .query(({ input }) => getEvent(input)),
  getEventSecret: tokenProcedure
    .input(z.string())
    .output(SecretOutputSchema)
    .query(({ input }) => getEventSecret(input)),
  findOrCreateUser: tokenProcedure
    .input(UserCreateSchema)
    .output(UserSchema)
    .mutation(({ input }) => createUser(input)),
  setEventRsvp: tokenProcedure
    .input(EditRSVPUserSchema)
    .output(RSVPSchema)
    .mutation(({ input: { userId, ...rest } }) =>
      editUserRsvpStatus(userId, rest)
    ),
  getAutocompleteEvents: tokenProcedure
    .input(z.string())
    .output(z.array(EventSchema))
    .query(({ input }) => getAutocompleteEvents(input)),
  selfCheckin: tokenProcedure
    .input(SelfCheckinWithUserId)
    .output(RSVPSchema)
    .mutation(({ input: { userId, ...rest } }) => selfCheckin(userId, rest)),
  addBuildPoints: tokenProcedure
    .input(AddBuildPointsUserSchema)
    .output(BuildPointSchema)
    .mutation(({ input }) => addUserBuildPoints(input)),
  buildPointsLeaderboard: tokenProcedure
    .input(OutreachTimeSchema)
    .output(PagedBuildPointUsersSchema)
    .query(({ input }) => getBuildPoints(input)),
});
