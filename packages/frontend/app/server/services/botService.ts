import {
  ActionRowBuilder,
  ButtonBuilder,
  EmbedBuilder,
  roleMention,
  time,
} from "@discordjs/builders";
import {
  ButtonStyle,
  type RESTPostAPIChannelMessageJSONBody,
} from "@discordjs/core";
import { eq } from "drizzle-orm";
import { DateTime } from "luxon";
import type { z } from "zod";
import db from "../drizzle/db";
import {
  eventParsingRuleTable,
  eventTable,
  rsvpTable,
} from "../drizzle/schema";
import env from "../env";
import type { RSVPUserSchema } from "../schema";

interface MessageParams {
  eventId: string;
}

const statusToEmoji = (
  status: z.infer<typeof RSVPUserSchema>["status"],
  delay?: number,
) => {
  switch (status) {
    case "YES":
      return ":white_check_mark:";
    case "NO":
      return ":x:";
    case "MAYBE":
      return ":grey_question:";
    case "LATE":
      return delay ? `:clock3: - ${delay}m late` : ":clock3:";
    case "ATTENDED":
      return ":ok:";
    default:
      return "";
  }
};

/**
 * Generates an announcement message for an event
 * @param data The data to generate the message with
 * @returns The message data
 */
export async function generateMessage(data: MessageParams) {
  const { eventId } = data;

  const eventRSVPs = await db.query.rsvpTable.findMany({
    where: eq(rsvpTable.eventId, eventId),
    with: {
      user: {
        columns: {
          roles: true,
          username: true,
        },
      },
    },
  });

  const eventData = await db.query.eventTable.findFirst({
    where: eq(eventTable.id, eventId),
  });

  if (!eventData) {
    throw new Error("Event not found");
  }

  const { ruleId } = eventData;

  const roleIds: string[] = [];

  if (ruleId === null) {
    roleIds.push(env.VITE_GUILD_ID);

    if (eventData.type === "Mentor") {
      roleIds.push(env.VITE_MENTOR_ROLE_ID);
    }
  } else {
    const eventRule = await db.query.eventParsingRuleTable.findFirst({
      where: eq(eventParsingRuleTable.id, ruleId),
    });
    if (!eventRule) {
      throw new Error("Event Rule not found");
    }
    roleIds.push(...eventRule.roleIds);
  }

  const mentorRSVPs = eventRSVPs.filter((rsvpUser) =>
    rsvpUser.user.roles?.includes(env.VITE_MENTOR_ROLE_ID),
  );

  const otherRSVPs = eventRSVPs.filter(
    (rsvpUser) => !rsvpUser.user.roles?.includes(env.VITE_MENTOR_ROLE_ID),
  );

  /** A list of role mentionds seperated by commas and "and" at the end */
  const roleMentionList =
    roleIds.length > 1
      ? `${roleIds.slice(0, -1).map(roleMention).join(", ")} and ${roleMention(roleIds[roleIds.length - 1])}`
      : roleMention(roleIds[0]);

  const meetingInfo = new EmbedBuilder({
    description: eventData.description.length
      ? eventData.description
      : undefined,
  })
    .setTitle(eventData.title)
    .addFields(
      {
        name: "Roles",
        value: roleMentionList,
        inline: true,
      },
      {
        name: "Start Time",
        value: time(
          DateTime.fromMillis(Date.parse(eventData.startDate)).toJSDate(),
          "F",
        ),
        inline: true,
      },
      {
        name: "End Time",
        value: time(
          DateTime.fromMillis(Date.parse(eventData.endDate)).toJSDate(),
          "F",
        ),
        inline: true,
      },
    )
    .setURL(`${env.VITE_FRONTEND_URL}/events/${eventData.id}`)
    .setColor([49, 49, 96]);

  const messageComponent = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId(`event/${eventData.id}/rsvp/${"YES"}`)
      .setStyle(ButtonStyle.Success)
      .setLabel("Coming"),
    new ButtonBuilder()
      .setCustomId(`event/${eventData.id}/rsvp/${"MAYBE"}`)
      .setStyle(ButtonStyle.Secondary)
      .setLabel("Maybe"),
    new ButtonBuilder()
      .setCustomId(`event/${eventData.id}/rsvp/${"NO"}`)
      .setStyle(ButtonStyle.Danger)
      .setLabel("Not Coming"),
    new ButtonBuilder()
      .setCustomId(`event/${eventData.id}/rsvp/${"LATE"}`)
      .setStyle(ButtonStyle.Primary)
      .setLabel("Late"),
    new ButtonBuilder()
      .setCustomId(`event/${eventData.id}/checkin`)
      .setStyle(ButtonStyle.Primary)
      .setLabel("Check In"),
  );

  const embeds: Array<EmbedBuilder> = [meetingInfo];

  if (mentorRSVPs.length) {
    const content = mentorRSVPs
      .map(
        (rawRsvp) =>
          `${rawRsvp.user.username} - ${statusToEmoji(rawRsvp.status, rawRsvp.delay ?? undefined)}`,
      )
      .join("\n");
    const count = mentorRSVPs.filter(
      (rsvp) => rsvp.status === "YES" || rsvp.status === "LATE",
    ).length;
    const mentorEmbed = new EmbedBuilder()
      .setTitle(`Mentors (${count})`)
      .setDescription(content)
      .setColor([80, 69, 6]);

    embeds.push(mentorEmbed);
  }

  if (otherRSVPs.length) {
    const content = otherRSVPs
      .map(
        (rawRsvp) =>
          `${rawRsvp.user.username} - ${statusToEmoji(rawRsvp.status)}`,
      )
      .join("\n");
    const count = otherRSVPs.filter(
      (rsvp) => rsvp.status === "YES" || rsvp.status === "LATE",
    ).length;
    const otherEmbed = new EmbedBuilder()
      .setTitle(`Others (${count})`)
      .setDescription(content)
      .setColor([44, 82, 12]);

    embeds.push(otherEmbed);
  }

  return {
    content: `Please RSVP (${roleMentionList})`,
    embeds: embeds.map((embed) => embed.toJSON()),
    components: [messageComponent.toJSON()],
  } satisfies RESTPostAPIChannelMessageJSONBody;
}
