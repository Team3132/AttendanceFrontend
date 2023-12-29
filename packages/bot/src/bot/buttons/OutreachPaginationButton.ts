import { BACKEND_TOKEN, type BackendClient } from '@/backend/backend.module';
import { Inject, Injectable, UseGuards } from '@nestjs/common';
import { GuildMemberGuard } from '../guards/GuildMemberGuard';
import {
  Button,
  type ButtonContext,
  ComponentParam,
  Context,
  SlashCommand,
  type SlashCommandContext,
} from 'necord';
import { LeaderBoardUser } from 'backend/schema';
import { Duration } from 'luxon';
import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
} from 'discord.js';
import { z } from 'zod';

const roundDuration = (duration: Duration) => {
  const millis = duration.toMillis();
  // round to the nearest minute
  const rounded = Math.round(millis / 60000) * 60000;
  const hours = Math.floor(rounded / 3600000);
  const minutes = Math.floor((rounded % 3600000) / 60000);
  return Duration.fromObject({ hours, minutes });
};

const leaderboardLine = (data: z.infer<typeof LeaderBoardUser>) =>
  `${data.rank}. **${data.username}** - ${roundDuration(
    Duration.fromISO(data.duration),
  ).toHuman()}`;

function randomStr(length: number = 8): string {
  const alphanumericCharacters =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';

  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(
      Math.random() * alphanumericCharacters.length,
    );
    result += alphanumericCharacters[randomIndex];
  }

  return result;
}

const guildId = process.env['GUILD_ID'];

@Injectable()
export class OutreachPaginationButton {
  constructor(
    @Inject(BACKEND_TOKEN) private readonly backendClient: BackendClient,
  ) {}

  @UseGuards(GuildMemberGuard)
  @Button('leaderboard/:toPage/:random')
  public async onPageChange(
    @Context() [interaction]: ButtonContext,
    @ComponentParam('toPage') toPage: string,
  ) {
    const to = parseInt(toPage);

    const { embed, messageComponent } = await this.createMessage(to);

    await interaction.update({
      embeds: [embed],
      components: [messageComponent],
    });
  }

  @UseGuards(GuildMemberGuard)
  @SlashCommand({
    name: 'leaderboard',
    description: 'Get the leaderboard for outreach hours',
    guilds: guildId ? [guildId] : undefined,
    dmPermission: false,
  })
  public async onLeaderboard(@Context() [interaction]: SlashCommandContext) {
    const { embed, messageComponent } = await this.createMessage(1);

    await interaction.reply({
      embeds: [embed],
      components: [messageComponent],
    });
  }

  public async createMessage(page: number) {
    const perPage = 10;

    const { items: leaderBoardData } =
      await this.backendClient.client.bot.leaderboard.query({
        cursor: page - 1,
        limit: perPage,
      });

    // pages start at 1
    const maxPage = Math.ceil(leaderBoardData.length / perPage);

    if (page > maxPage || page < 1) throw new Error('Invalid page');

    const start = (page - 1) * perPage;

    const end = start + perPage;

    const pageData = leaderBoardData.slice(start, end);

    const embed = new EmbedBuilder()
      .setTitle(`Outreach Leaderboard ${page}/${maxPage}`)
      .setTimestamp(new Date());

    const lines = pageData.map(leaderboardLine).join('\n');

    embed.setDescription(lines);

    const messageComponent =
      new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder()
          .setCustomId(`leaderboard/${1}/${randomStr(4)}`)
          .setLabel('First')
          .setStyle(ButtonStyle.Secondary)
          .setDisabled(page === 1),
        new ButtonBuilder()
          .setCustomId(`leaderboard/${page - 1}/${randomStr(4)}`)
          .setLabel('Previous')
          .setStyle(ButtonStyle.Secondary)
          .setDisabled(page === 1),
        new ButtonBuilder()
          .setCustomId(`leaderboard/${page + 1}/${randomStr(4)}`)
          .setLabel('Next')
          .setStyle(ButtonStyle.Secondary)
          .setDisabled(page === maxPage),
        new ButtonBuilder()
          .setCustomId(`leaderboard/${maxPage}/${randomStr(4)}`)
          .setLabel('Last')
          .setStyle(ButtonStyle.Secondary)
          .setDisabled(page === maxPage),
      );

    return { embed, messageComponent };
  }
}
