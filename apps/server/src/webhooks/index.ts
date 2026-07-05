import { Hono } from "hono";
import { polarApp } from "./polar";

const webhookApp = new Hono();

webhookApp.route("/polar/webhooks", polarApp);

export default webhookApp;
