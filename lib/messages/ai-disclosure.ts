import { initialContacts } from "@/data/messages/initial-contacts";

const LIVING_NAMES = new Set(
  initialContacts.filter((contact) => contact.living).map((contact) => contact.name)
);

function joinNames(names: string[]): string {
  if (names.length <= 1) return names[0] ?? "";
  if (names.length === 2) return `${names[0]} or ${names[1]}`;
  return `${names.slice(0, -1).join(", ")} or ${names[names.length - 1]}`;
}

/**
 * The line a thread opens with when any of its personas is a living person,
 * set where Messages puts its service-and-date line. Null when everyone in the
 * thread is historical, or is someone the visitor typed in themselves.
 */
export function getAiDisclosure(recipientNames: string[]): string | null {
  const living = recipientNames.filter((name) => LIVING_NAMES.has(name));
  if (living.length === 0) return null;
  return `AI simulation · not the real ${joinNames(living)}`;
}
