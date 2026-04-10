import type { GuestProfile } from "@/types";

/**
 * Migrate a GuestProfile from old format (single phone/lounger) to new format
 * (members array + loungerIds array). Safe to call multiple times.
 */
export function migrateGuestProfile(guest: GuestProfile): GuestProfile {
  // Ensure members array exists
  if (!guest.members || guest.members.length === 0) {
    guest.members = [{
      phone: guest.phone,
      name: guest.name,
      email: guest.email,
    }];
  }

  // Ensure loungerIds array exists
  if (!guest.loungerIds || guest.loungerIds.length === 0) {
    guest.loungerIds = guest.loungerId ? [guest.loungerId] : [];
  }

  // Ensure backward compat fields are synced
  if (guest.members.length > 0) {
    guest.phone = guest.members[0].phone;
    guest.name = guest.members[0].name;
    guest.email = guest.members[0].email;
  }
  if (guest.loungerIds.length > 0) {
    guest.loungerId = guest.loungerIds[0];
  }

  return guest;
}

/** Migrate an array of guests */
export function migrateGuests(guests: GuestProfile[]): GuestProfile[] {
  return guests.map(migrateGuestProfile);
}
