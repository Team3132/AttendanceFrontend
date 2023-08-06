import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
  ClassSerializerInterceptor,
  UseInterceptors,
  NotFoundException,
  BadRequestException,
  Req,
  Res,
  Inject,
} from '@nestjs/common';
import { EventService } from './event.service';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { SessionGuard } from '@auth/guard/session.guard';
import { Roles } from '@auth/decorators/DiscordRoleDecorator.decorator';
import {
  ApiBadRequestResponse,
  ApiCookieAuth,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { RsvpService } from '@rsvp/rsvp.service';
import { Rsvp } from '@rsvp/entities/rsvp.entity';
import { GetUser } from '@auth/decorators/GetUserDecorator.decorator';
import { UpdateOrCreateRSVP } from './dto/update-rsvp.dto';
import { ScaninDto } from './dto/scanin.dto';
import { GetEventsDto } from './dto/get-events.dto';
import { EventResponse, EventResponseType } from './dto/event-response.dto';
import { EventSecret } from './dto/event-secret.dto';
import { ApiResponseTypeNotFound } from '@/standard-error.entity';
import { ConfigService } from '@nestjs/config';
import TokenCheckinDto from './dto/checkin-dto';
import { RsvpUser } from './dto/rsvp-user.dto';
import { Request, Response } from 'express';
import { DRIZZLE_TOKEN, type DrizzleDatabase } from '@/drizzle/drizzle.module';
import { asc, between, eq, gte, lte, or } from 'drizzle-orm';
import { event, rsvp } from '../drizzle/schema';
import { v4 as uuid } from 'uuid';
import { DateTime } from 'luxon';

@ApiTags('Event')
@UseInterceptors(ClassSerializerInterceptor)
@Controller('event')
export class EventController {
  constructor(
    private readonly eventService: EventService,
    private readonly rsvpService: RsvpService,
    private readonly configService: ConfigService,
    @Inject(DRIZZLE_TOKEN) private readonly db: DrizzleDatabase,
  ) {}

  /**
   * Get all events
   * @returns {Event[]}
   */
  @ApiCookieAuth()
  @UseGuards(SessionGuard)
  @ApiOkResponse({ type: [EventResponseType] })
  @ApiOperation({ description: 'Get all events', operationId: 'getEvents' })
  @Get()
  async findAll(
    @Query() eventsGet: GetEventsDto,
  ): Promise<EventResponseType[]> {
    const { from, to, take, type } = eventsGet;
    const events = await this.db.query.event.findMany({
      where: (event, { and }) => {
        const conditions = [];
        if (from && to) {
          conditions.push(between(event.startDate, from, to));
        } else {
          if (from) {
            conditions.push(
              or(gte(event.startDate, from), gte(event.endDate, from)),
            );
          }
          if (to) {
            conditions.push(
              or(lte(event.startDate, to), lte(event.endDate, to)),
            );
          }
        }

        if (type) {
          conditions.push(eq(event.type, type));
        }

        return and(...conditions);
      },
      limit: take,
      orderBy: (event) => [asc(event.startDate)],
    });

    return events.map((event) => new EventResponse(event));
  }

  /**
   * Create a new event
   * @param createEventDto The event creation data
   * @returns {Event}
   */
  @ApiCookieAuth()
  @UseGuards(SessionGuard)
  @ApiOperation({
    description: 'Create a new event',
    operationId: 'createEvent',
  })
  @ApiCreatedResponse({ type: EventResponseType })
  @Roles(['MENTOR'])
  @Post()
  async create(
    @Body() createEventDto: CreateEventDto,
  ): Promise<EventResponseType> {
    const event = await this.eventService.createEvent({
      id: uuid(),
      ...createEventDto,
    });
    return new EventResponse(event);
  }

  /**
   * Get a specific event
   * @returns {Event}
   */
  @ApiCookieAuth()
  @UseGuards(SessionGuard)
  @ApiOperation({
    description: 'Get a specific event',
    operationId: 'getEvent',
  })
  @ApiNotFoundResponse({ type: ApiResponseTypeNotFound })
  @ApiOkResponse({ type: EventResponseType })
  @Get(':id')
  async findOne(@Param('id') id: string): Promise<EventResponseType> {
    const event = await this.db.query.event.findFirst({
      where: (event, { eq }) => eq(event.id, id),
    });
    if (!event) {
      throw new NotFoundException('Event not found');
    }
    return new EventResponse(event);
  }

  /**
   * Get a specific event secret
   * @returns {EventSecret}
   */
  @ApiCookieAuth()
  @UseGuards(SessionGuard)
  @ApiOperation({
    description: 'Get a specific event secret',
    operationId: 'getEventSecret',
  })
  @Roles(['MENTOR'])
  @ApiOkResponse({ type: EventSecret })
  @ApiNotFoundResponse({ type: ApiResponseTypeNotFound })
  @Get(':eventId/token')
  async getEventSecret(
    @Param('eventId') eventId: string,
  ): Promise<EventSecret> {
    const event = await this.db.query.event.findFirst({
      where: (event, { eq }) => eq(event.id, eventId),
    });
    if (!event) {
      throw new NotFoundException('Event not found');
    }

    return new EventSecret(event);
  }

  /**
   * Callback for the successful token
   */
  @ApiOperation({
    description: 'Callback for a successful token',
    operationId: 'getEventSecretCallback',
  })
  @Get(':eventId/token/callback')
  async eventTokenCallback(
    @Req() req: Request,
    @Res() res: Response,
    @Query('code') code: string,
    @Param('eventId') eventId: string,
    @GetUser('id') userId?: string,
  ) {
    if (!code) throw new BadRequestException('Code is required');
    if (!userId) {
      return res
        .status(302)
        .cookie('redirectTo', req.originalUrl)
        .redirect(`/api/auth/discord`);
    } else {
      await this.eventService.checkinUser(eventId, userId, code);

      return res
        .status(302)
        .redirect(
          `${this.configService.getOrThrow('FRONTEND_URL')}/events/${eventId}`,
        );
    }
  }

  @ApiCookieAuth()
  @UseGuards(SessionGuard)
  @ApiOperation({
    description: 'Callback for a valid code (client input)',
    operationId: 'scanintoEvent',
  })
  @ApiCreatedResponse({ type: Rsvp })
  @Post(':eventId/token/callback')
  async eventTokenPostCallback(
    @Body() body: TokenCheckinDto,
    @Param('eventId') eventId: string,
    @GetUser('id') userId: string,
  ): Promise<Rsvp> {
    const { code } = body;
    const rsvp = await this.eventService.checkinUser(eventId, userId, code);
    return new Rsvp(rsvp);
  }

  @ApiCookieAuth()
  @UseGuards(SessionGuard)
  @ApiOperation({
    description: "Checkout a user's RSVP",
    operationId: 'checkoutUser',
  })
  @ApiCreatedResponse({ type: Rsvp })
  @Post(':eventId/checkout')
  async checkoutUser(
    @Param('eventId') eventId: string,
    @GetUser('id') userId: string,
  ): Promise<Rsvp> {
    const checkedOutRsvp = await this.eventService.checkoutUser(
      eventId,
      userId,
    );
    return new Rsvp(checkedOutRsvp);
  }

  /**
   * Update an event.
   * @param updateEventDto Event Update Data
   * @returns {EventResponseType}
   */
  @ApiCookieAuth()
  @UseGuards(SessionGuard)
  @ApiOperation({ description: 'Update an event', operationId: 'updateEvent' })
  @ApiOkResponse({ type: EventResponseType })
  @Roles(['MENTOR'])
  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateEventDto: UpdateEventDto,
  ): Promise<EventResponseType> {
    const updatedEvent = await this.db
      .update(event)
      .set(updateEventDto)
      .where(eq(event.id, id))
      .returning();

    const firstReturned = updatedEvent.at(0);

    if (!firstReturned) throw new NotFoundException('Event not found');

    return new EventResponse(firstReturned);
  }

  /**
   * Delete an event
   * @returns {EventResponseType}
   */
  @ApiCookieAuth()
  @UseGuards(SessionGuard)
  @ApiOperation({ description: 'Delete an event', operationId: 'deleteEvent' })
  @ApiOkResponse({ type: EventResponseType })
  @Roles(['MENTOR'])
  @Delete(':id')
  async remove(@Param('id') id: string): Promise<EventResponse> {
    const event = await this.eventService.deleteEvent(id);
    return new EventResponse(event);
  }

  /**
   * Get a user's rsvp status for an event.
   * @returns {Rsvp}
   */
  @ApiCookieAuth()
  @UseGuards(SessionGuard)
  @ApiOperation({
    description: "Get a user's rsvp status for an event",
    operationId: 'getEventRsvp',
  })
  @ApiOkResponse({ type: Rsvp })
  @Get(':eventId/rsvp')
  async getEventRsvp(
    @Param('eventId') eventId: string,
    @GetUser('id') userId: Express.User['id'],
  ): Promise<Rsvp> {
    const eventRsvp = await this.db.query.rsvp.findFirst({
      where: (rsvp, { and }) =>
        and(eq(rsvp.eventId, eventId), eq(rsvp.userId, userId)),
    });
    return new Rsvp(eventRsvp);
  }

  /**
   * Set a logged in user's RSVP status for an event.
   * @param setRSVPDto RSVP status
   * @returns {Rsvp}
   */
  @ApiCookieAuth()
  @UseGuards(SessionGuard)
  @ApiOperation({
    description: "Set a logged in user's RSVP status for an event",
    operationId: 'setEventRsvp',
  })
  @ApiCreatedResponse({ type: Rsvp })
  @Post(':eventId/rsvp')
  async setEventRsvp(
    @Param('eventId') eventId: string,
    @GetUser('id') userId: Express.User['id'],
    @Body() { status }: UpdateOrCreateRSVP,
  ): Promise<Rsvp> {
    const fetchedEvent = await this.db.query.event.findFirst({
      where: (event, { eq }) => eq(event.id, eventId),
    });

    if (!fetchedEvent) throw new NotFoundException('Event not found');

    if (DateTime.fromISO(fetchedEvent.endDate).toMillis() < Date.now())
      throw new BadRequestException('Event has already ended');

    const newOrUpdatedRsvp = await this.db
      .insert(rsvp)
      .values({
        id: uuid(),
        eventId,
        userId,
        status,
      })
      .onConflictDoUpdate({
        set: {
          status,
        },
        target: [rsvp.eventId, rsvp.userId],
      })
      .returning();

    if (newOrUpdatedRsvp.length === 0)
      throw new BadRequestException('Invalid status');

    return new Rsvp(newOrUpdatedRsvp.at(0));
  }

  /**
   * Get an event's asociated RSVPs
   * @returns {Rsvp[]}
   */
  @ApiCookieAuth()
  @UseGuards(SessionGuard)
  @ApiOperation({
    description: "Get an event's asociated RSVPs",
    operationId: 'getEventRsvps',
  })
  @ApiOkResponse({ type: [RsvpUser] })
  @Get(':eventId/rsvps')
  async getEventRsvps(@Param('eventId') eventId: string): Promise<RsvpUser[]> {
    const eventUserRsvps = await this.eventService.getEventUserRsvps(eventId);

    return eventUserRsvps.map((rsvp) => new RsvpUser(rsvp));
  }

  /**
   * RSVP to an event by using a scancode
   * @param eventId The event id
   * @param scanin The scanin data (code)
   * @returns {Rsvp}
   */
  @ApiCookieAuth()
  @UseGuards(SessionGuard)
  @ApiOperation({
    description: 'RSVP to an event by using a scancode',
    operationId: 'scaninEvent',
  })
  @ApiCreatedResponse({ type: Rsvp })
  @ApiBadRequestResponse({ description: 'Invalid Scancode' })
  @Post(':eventId/scanin')
  async scanin(@Param('eventId') eventId: string, @Body() scanin: ScaninDto) {
    const { code } = scanin;
    const scaninResult = await this.rsvpService.scanin({ eventId, code });

    if (!scaninResult) throw new BadRequestException('Invalid Scancode');

    return new Rsvp(scaninResult);
  }
}
