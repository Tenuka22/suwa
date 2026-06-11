import { chatPatient } from "./chat-patient";
import { getChatHistoryRoute } from "./routes/get-chat-history";
import { clearChatHistoryRoute } from "./routes/clear-chat-history";

export const chatRouter = {
  chatPatient,
  getChatHistory: getChatHistoryRoute,
  clearChatHistory: clearChatHistoryRoute,
};
