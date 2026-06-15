import {
  buyItemRoute,
  completeWellnessActionRoute,
  feedSpriteRoute,
  getInventoryRoute,
  getLeaderboardRoute,
  getMoonlightCreditsRoute,
  getRecentTransactionsRoute,
  getSpriteCollectionRoute,
  getSpriteStateRoute,
  getTodayTasksRoute,
  getWellnessHistoryRoute,
} from "./routes/index";

export const gamificationRouter = {
  getSpriteState: getSpriteStateRoute,
  completeWellnessAction: completeWellnessActionRoute,
  getMoonlightCredits: getMoonlightCreditsRoute,
  getWellnessHistory: getWellnessHistoryRoute,
  getRecentTransactions: getRecentTransactionsRoute,
  getTodayTasks: getTodayTasksRoute,
  getLeaderboard: getLeaderboardRoute,
  buyItem: buyItemRoute,
  feedSprite: feedSpriteRoute,
  getInventory: getInventoryRoute,
  getSpriteCollection: getSpriteCollectionRoute,
};
