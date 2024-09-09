import  Product from "../models/products.js";

export const getProducts = async (req, res, next) => {
  try {
    const allProducts = await Product.findAll(); 

    res.status(200).json(allProducts);
  } catch (error) {
    console.error("Error fetching Product:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};
