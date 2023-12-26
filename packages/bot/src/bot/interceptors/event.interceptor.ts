import { BACKEND_TOKEN, type BackendClient } from '@/backend/backend.module';
import { Inject, Injectable } from '@nestjs/common';
import { AutocompleteInteraction, CacheType } from 'discord.js';
import { DateTime } from 'luxon';
import { AutocompleteInterceptor } from 'necord';
import { EventSchema } from '@team3132/attendance-backend/schema';
import { z } from 'zod';

@Injectable()
export class EventAutocompleteInterceptor extends AutocompleteInterceptor {
  constructor(
    @Inject(BACKEND_TOKEN) private readonly backendClient: BackendClient,
  ) {
    super();
  }

  public async transformOptions(
    interaction: AutocompleteInteraction<CacheType>,
  ) {
    const focused = interaction.options.getFocused(true);

    // const options = await this.db.event.findMany({
    //   where: {
    //     title: {
    //       mode: 'insensitive',
    //       contains: focused.value.toString(),
    //     },
    //     endDate: {
    //       gte: new Date(),
    //     },
    //   },
    //   orderBy: {
    //     startDate: 'asc',
    //   },
    //   take: 10,
    // });

    const options =
      await this.backendClient.client.bot.getAutocompleteEvents.query(
        focused.value,
      );

    const dateEvent = (event: z.infer<typeof EventSchema>) => ({
      name: `${event.title} - ${DateTime.fromISO(
        event.startDate,
      ).toLocaleString(DateTime.DATETIME_SHORT)} - ${DateTime.fromISO(
        event.endDate,
      ).toLocaleString(DateTime.DATETIME_SHORT)} `,
      value: event.id,
    });

    const datedEvents = options.map(dateEvent);

    interaction.respond(datedEvents);
  }
}
