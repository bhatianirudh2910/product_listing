import { DataTypes } from 'sequelize';
import DB from '../config/dbConnect.js'; 

const Product = DB.define('products', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  title: {
    type: DataTypes.STRING,
    allowNull: true
  },
  product_id: {
    type: DataTypes.STRING,
    allowNull: true
  },
  sku: {
    type: DataTypes.STRING,
    allowNull: true
  },
  description: {  
    type: DataTypes.TEXT, 
    allowNull: true
  },
  image: {
    type: DataTypes.STRING,
    allowNull: true
  },
  stock: {  
    type: DataTypes.INTEGER,  
    allowNull: true
  },
  metafield1: {  
    type: DataTypes.TEXT, 
    allowNull: true
  },
  metafield2: {  
    type: DataTypes.TEXT, 
    allowNull: true
  },
  metafield3: {  
    type: DataTypes.TEXT, 
    allowNull: true
  },
  metafield4: {  
    type: DataTypes.TEXT, 
    allowNull: true
  },
  metafield5: {  
    type: DataTypes.TEXT, 
    allowNull: true
  },
});

async function syncDatabase() {
  try {
    await DB.sync();
    console.log("Database synchronized successfully.");
  } catch (error) {
    console.error('Failed to synchronize the database:', error);
  }
}

syncDatabase();

export default Product;
