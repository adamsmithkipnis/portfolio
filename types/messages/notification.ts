export interface MessagesNotificationPayload {
  id: string;
  conversationId: string;
  sender: string;
  title: string;
  body: string;
  type: "message" | "reaction";
  /** How long the banner stays up when not hovered; defaults to 3s. */
  durationMs?: number;
}
