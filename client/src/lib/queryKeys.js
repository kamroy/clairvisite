export const queryKeys = {
  me: ["me"],
  regions: ["regions"],
  technicians: {
    all: ["technicians"],
    search: (params) => ["technicians", "search", params],
    detail: (id) => ["technicians", "detail", id],
    myProfile: ["technicians", "myProfile"],
  },
  availabilities: {
    mine: ["availabilities", "mine"],
  },
  bookings: {
    mine: ["bookings", "mine"],
    technician: ["bookings", "technician"],
  },
  admin: {
    technicians: ["admin", "technicians"],
  },
};
