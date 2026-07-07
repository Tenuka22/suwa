import { Hono } from "hono";
import { stripeApp } from "./stripe";

const webhookApp = new Hono();

webhookApp.route("/stripe/webhook", stripeApp);

export default webhookApp;
