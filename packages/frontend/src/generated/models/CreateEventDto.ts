/* generated using openapi-typescript-codegen -- do no edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */

export type CreateEventDto = {
  description?: string;
  title: string;
  startDate: string;
  endDate: string;
  allDay?: boolean;
  type: CreateEventDto.type;
  roles?: Array<string>;
};

export namespace CreateEventDto {
  export enum type {
    SOCIAL = "Social",
    REGULAR = "Regular",
    OUTREACH = "Outreach",
  }
}
