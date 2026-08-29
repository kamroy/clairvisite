export const queryKeys = {
  me: ["me"],
  regions: ["regions"],
  technicians: {
    all: ["technicians"],
    search: (params) => ["technicians", "search", params],
    detail: (id) => ["technicians", "detail", id],
    similar: (id) => ["technicians", "similar", id],
    pricingItems: (id) => ["technicians", "pricingItems", id],
    portfolio: (id) => ["technicians", "portfolio", id],
    myProfile: ["technicians", "myProfile"],
    myDocuments: ["technicians", "myDocuments"],
  },
  availabilities: {
    mine: ["availabilities", "mine"],
  },
  bookings: {
    mine: ["bookings", "mine"],
    technician: ["bookings", "technician"],
  },
  reports: {
    forBooking: (bookingId) => ["reports", bookingId],
  },
  conversations: {
    mine: (params) => ["conversations", "mine", params],
    forBooking: (bookingId) => ["conversations", bookingId],
  },
  admin: {
    technicians: (params) => ["admin", "technicians", params],
  },
};
