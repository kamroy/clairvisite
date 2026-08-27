export class Availability {
  constructor(
    public readonly id: string,
    public readonly technicianId: string,
    public readonly startDatetime: Date,
    public readonly endDatetime: Date,
    public readonly isBooked: boolean,
  ) {}
}
