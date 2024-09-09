import express from 'express';
import { getProducts }  from "../controllers/productController.js";
import  Product from "../models/products.js";


const router = express.Router();

router.get('/getProducts', getProducts);
router.post('/product/create', async (req, res) =>{
    
    let product = req.body.product;

    try {
    
        const newProduct = await Product.create({
          title: product.title,
          product_id:product.id,
          sku:product.sku,
          description:product.body_html,
          image:product.images,
          stock:product.variants[0].inventory_quantity,
          metafield1: metafields[0] || null,
          metafield2: metafields[1] || null,
          metafield3: metafields[2] || null,
          metafield4: metafields[3] || null,
          metafield5: metafields[4] || null,
        });
    
        res.status(201).json(newProduct); 
      } catch (error) {
        console.error('Error creating product:', error);
        res.status(500).json({ error: 'Failed to create product' });
      }

});

 
export default router;