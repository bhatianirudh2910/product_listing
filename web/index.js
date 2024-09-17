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
import webhookHandlers from './webhook-handlers.js';

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

// Mock database for sessions (replace with your actual session management)
const sessions = new Map(); // Replace with actual session store

// Store session after Shopify login
app.get(shopify.config.auth.callbackPath, async (req, res, next) => {
  try {
    const { shop } = req.query;
    const session = await shopify.auth.callback()(req, res, next); // Existing callback function
    if (session && shop) {
      sessions.set(shop, session);
    }
    return res.redirect(shopify.redirectToShopifyOrAppRoot());
  } catch (error) {
    console.error('Error during authentication:', error);
    return res.status(500).send('Authentication failed');
  }
});

async function fetchProductsFromShopify(session) {
  try {
    const client = new shopify.api.clients.Graphql({ session });

    const response = await client.request(`
      query {
        products(first: 250) {
          edges {
            node {
              id
              title
              variants(first: 1) {
                edges {
                  node {
                    sku
                    inventoryQuantity
                  }
                }
              }
              descriptionHtml
              images(first: 1) {
                edges {
                  node {
                    src
                  }
                }
              }
              metafields(first: 5) {
                edges {
                  node {
                    key
                    value
                  }
                }
              }
            }
          }
        }
      }
    `);

    return response.data.products.edges.map(edge => {
      const product = edge.node;
      return {
        product_id: product.id,
        title: product.title,
        sku: product.variants.edges[0]?.node.sku || null,
        description: product.descriptionHtml,
        image: product.images.edges[0]?.node.src || null,
        stock: product.variants.edges[0]?.node.inventoryQuantity || null,
        metafield1: product.metafields.edges.find(mf => mf.node.key === 'metafield1')?.node.value || null,
        metafield2: product.metafields.edges.find(mf => mf.node.key === 'metafield2')?.node.value || null,
        metafield3: product.metafields.edges.find(mf => mf.node.key === 'metafield3')?.node.value || null,
        metafield4: product.metafields.edges.find(mf => mf.node.key === 'metafield4')?.node.value || null,
        metafield5: product.metafields.edges.find(mf => mf.node.key === 'metafield5')?.node.value || null,
      };
    });
  } catch (error) {
    console.error('Error fetching products from Shopify:', error);
    throw error;
  }
}

async function syncProductsToDatabase(session) {
  try {
    const products = await fetchProductsFromShopify(session);

    for (const product of products) {
      await Product.upsert(product); // Use upsert to avoid duplicates
    }

    console.log('Products synchronized successfully.');
  } catch (error) {
    console.error('Error syncing products to database:', error);
    throw error;
  }
}

app.get("/sync-produts", async (req, res) => {
  try {
    const shop = req.query.shop; // Get the shop parameter from the query

    if (!shop) {
      return res.status(400).send('Shop parameter is required.');
    }

    const session = sessions.get(shop);

    if (!session) {
      return res.status(401).send('Unauthorized');
    }

    await syncProductsToDatabase(session);
    res.status(200).send('Products synchronized successfully.');
  } catch (error) {
    console.error('Failed to synchronize products:', error);
    res.status(500).send('Failed to synchronize products');
  }
});

app.use("/api/", apiRoutes); 
app.use("/webhook/", apiRoutes); 

app.post("/api/products", async (req, res) => {
  let status = 200;
  let error = null;

  try {
    const shop = req.query.shop; // Get the shop parameter from the query

    if (!shop) {
      throw new Error('Shop parameter is required.');
    }

    const session = sessions.get(shop); // Retrieve the session from the mock database

    await productCreator(session);
  } catch (e) {
    console.log(`Failed to process products/create: ${e.message}`);
    status = 500;
    error = e.message;
  }
  res.status(status).send({ success: status === 200, error });
});

app.use(shopify.cspHeaders());
app.use(serveStatic(STATIC_PATH, { index: false }));

app.use("/*", shopify.ensureInstalledOnShop(), async (_req, res) => {
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
