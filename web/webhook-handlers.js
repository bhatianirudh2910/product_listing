
import { DeliveryMethod } from '@shopify/shopify-api';

export default {
    PRODUCTS_CREATE: {
      deliveryMethod: DeliveryMethod.Http,
      callbackUrl: '/api/webhooks/products/create', // this matches the webhook registration URL
      callback: async (topic, shop, body, webhookId) => {
        const payload = JSON.parse(body);
        console.log('Product Created:', payload);
        // You can handle the product creation logic here
      }
    }
  };
  