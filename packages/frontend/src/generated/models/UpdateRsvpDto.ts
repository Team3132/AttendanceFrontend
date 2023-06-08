/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */

export type UpdateRsvpDto = {
  eventId?: string;
  status?: UpdateRsvpDto.status;
  attended?: boolean;
};

export namespace UpdateRsvpDto {
  export enum status {
    YES = "YES",
    NO = "NO",
    MAYBE = "MAYBE",
    LATE = "LATE",
  }
}
