import { Injectable, UseGuards } from "@nestjs/common";
import { Button, type ButtonContext, ComponentParam, Context } from "necord";
import { GuildMemberGuard } from "../guards/GuildMemberGuard";
import { CheckinModal } from "../modals/Checkin.modal";

@Injectable()
export class CheckinButton {
  constructor() {}

  @UseGuards(GuildMemberGuard)
  @Button("event/:eventId/checkin")
  public async onRsvpsButton(
    @Context() [interaction]: ButtonContext,
    @ComponentParam("eventId") eventId: string,
  ) {
    return interaction.showModal(CheckinModal.build(eventId));
  }
}
