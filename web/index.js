// index.js or your main server file
import { join } from "path";
import { readFileSync } from "fs";
import express from "express";
import serveStatic from "serve-static";
import bodyParser from "body-parser";
import crypto from 'crypto';

import apiRoutes from "./routes/api.js";
import shopify from "./shopify.js";
import productCreator from "./product-creator.js";
import PrivacyWebhookHandlers from "./privacy.js";

import dotenv from 'dotenv';
dotenv.config();

const PORT = parseInt(process.env.BACKEND_PORT || process.env.PORT || "3000", 10);
const STATIC_PATH = process.env.NODE_ENV === "production"
  ? `${process.cwd()}/frontend/dist`
  : `${process.cwd()}/frontend/`;

const app = express();

// Set up Shopify authentication and webhook handling
app.get(shopify.config.auth.path, shopify.auth.begin());
app.get(shopify.config.auth.callbackPath, shopify.auth.callback(), shopify.redirectToShopifyOrAppRoot());
app.post(shopify.config.webhooks.path, shopify.processWebhooks({ webhookHandlers: PrivacyWebhookHandlers }));

app.use(express.json());

// Register webhook after Shopify authentication
app.use(shopify.auth.callback(), async (req, res) => {
  await shopify.registerWebhooks(res.locals.shopify.session);
  res.redirect('/');
});

// Webhook handler for product creation
app.post('/webhook/products/create', bodyParser.json({ verify: (req, res, buf) => req.rawBody = buf }), shopify.handleProductCreateWebhook);

app.get("/api/products/count", async (_req, res) => {
  const client = new shopify.api.clients.Graphql({
    session: res.locals.shopify.session,
  });

  const countData = await client.request(`
    query shopifyProductCount {
      productsCount {
        count
      }
    }
  `);

  res.status(200).send({ count: countData.data.productsCount.count });
});

app.use("/api/", apiRoutes); 
app.use("/webhook/", apiRoutes); 

app.post("/api/products", async (_req, res) => {
  let status = 200;
  let error = null;

  try {
    await productCreator(res.locals.shopify.session);
  } catch (e) {
    console.log(`Failed to process products/create: ${e.message}`);
    status = 500;
    error = e.message;
  }
  res.status(status).send({ success: status === 200, error });
});

app.use(shopify.cspHeaders());
app.use(serveStatic(STATIC_PATH, { index: false }));

app.use("/*", shopify.ensureInstalledOnShop(), async (_req, res, _next) => {
  return res
    .status(200)
    .set("Content-Type", "text/html")
    .send(
      readFileSync(join(STATIC_PATH, "index.html"))
        .toString()
        .replace("%VITE_SHOPIFY_API_KEY%", process.env.SHOPIFY_API_KEY || "")
    );
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
