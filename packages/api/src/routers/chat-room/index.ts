import { listMessagesRoute } from "./routes/list-messages";
import { sendMessageRoute } from "./routes/send-message";
import { subscribeMessagesRoute } from "./routes/subscribe-messages";

export const chatRoomRouter = {
  send: sendMessageRoute,
  list: listMessagesRoute,
  subscribe: subscribeMessagesRoute,
};

export const chatRoomWsRouter = {
  subscribe: subscribeMessagesRoute,
};
