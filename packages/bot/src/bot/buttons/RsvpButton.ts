import {
  BACKEND_TOKEN,
  type BackendClient,
  isTRPCClientError,
} from "@/backend/backend.module";
import { Inject, Injectable, UseGuards } from "@nestjs/common";
import type { ConfigService } from "@nestjs/config";
import { EmbedBuilder } from "discord.js";
import { DateTime } from "luxon";
import { Button, type ButtonContext, ComponentParam, Context } from "necord";
import { GuildMemberGuard } from "../guards/GuildMemberGuard";
import rsvpToDescription from "../utils/rsvpToDescription";

@Injectable()
export class RsvpButton {
  constructor(
    private readonly config: ConfigService,
    @Inject(BACKEND_TOKEN) private readonly backendClient: BackendClient,
  ) {}

  @UseGuards(GuildMemberGuard)
  @Button("event/:eventId/rsvps")
  public async onRsvpsButton(
    @Context() [interaction]: ButtonContext,
    @ComponentParam("eventId") eventId: string,
  ) {
    try {
      const rsvpEvent =
        await this.backendClient.client.bot.getEventDetails.query(eventId);

      const eventRsvps =
        await this.backendClient.client.bot.getEventRsvps.query(eventId);

      if (!eventRsvps.length)
        return interaction.reply({ content: "No RSVPs", ephemeral: true });

      const firstIdRsvp = eventRsvps.at(0)?.id;

      const description = eventRsvps
        .map((rsvp) => rsvpToDescription(rsvp, firstIdRsvp === rsvp.id))
        .join("\n");

      const rsvpEmbed = new EmbedBuilder()
        .setTitle(
          `RSVPs for ${rsvpEvent.title} at ${DateTime.fromMillis(
            Date.parse(rsvpEvent.startDate),
          ).toLocaleString(DateTime.DATETIME_MED_WITH_WEEKDAY)}`,
        )
        .setDescription(description)
        .setTimestamp(new Date())
        .setURL(`${this.config.get("FRONTEND_URL")}/event/${rsvpEvent.id}`);

      return interaction.reply({
        ephemeral: true,
        embeds: [rsvpEmbed],
      });
    } catch (error) {
      if (isTRPCClientError(error)) {
        await interaction.reply({
          content: error.message,
          ephemeral: true,
        });
      } else {
        await interaction.reply({
          content: "Something went wrong. Please try again later.",
          ephemeral: true,
        });
      }
    }
  }
}
