import { PrismaService } from '@/prisma/prisma.service';
import { Injectable, UseInterceptors } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EmbedBuilder } from 'discord.js';
import { DateTime } from 'luxon';
import { SlashCommandContext, Options, Context, SlashCommand } from 'necord';
import { AttendanceDto } from '../dto/attendance.dto';
import { EventAutocompleteInterceptor } from '../interceptors/event.interceptor';
import attendanceToDescription from '../utils/attendanceToDescription';

@Injectable()
export class AttendanceCommand {
  constructor(
    private readonly db: PrismaService,
    private readonly config: ConfigService,
  ) {}

  @UseInterceptors(EventAutocompleteInterceptor)
  @SlashCommand({
    name: 'attendance',
    description: 'Get the attendance for a meeting.',
    guilds: [process.env['GUILD_ID']],
  })
  public async onAttendance(
    @Context() [interaction]: SlashCommandContext,
    @Options() { meeting, role }: AttendanceDto,
  ) {
    const fetchedMeeting = await this.db.event.findUnique({
      where: {
        id: meeting,
      },
    });

    if (!fetchedMeeting)
      return interaction.reply({ content: 'Unknown event', ephemeral: true });

    const fetchedRSVPs = await this.db.rSVP.findMany({
      where: {
        eventId: meeting,
        user: {
          roles: {
            has: role?.id,
          },
        },
      },
      include: {
        user: {
          select: {
            username: true,
          },
        },
      },
    });

    if (!fetchedRSVPs.length)
      return interaction.reply({ content: 'No responses', ephemeral: true });

    const description = fetchedRSVPs.map(attendanceToDescription).join(`\n`);

    const attendanceEmbed = new EmbedBuilder()
      .setTitle(
        `Attendance for ${fetchedMeeting.title} at ${DateTime.fromJSDate(
          fetchedMeeting.startDate,
        ).toLocaleString(DateTime.DATETIME_MED_WITH_WEEKDAY)}`,
      )
      .setDescription(description)
      .setTimestamp(new Date())
      .setURL(`${this.config.get('FRONTEND_URL')}/event/${fetchedMeeting.id}`);

    return interaction.reply({
      embeds: [attendanceEmbed],
    });
  }
}
