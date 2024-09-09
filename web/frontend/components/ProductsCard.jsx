import { useState, useEffect } from "react";
import { Card, TextContainer, Text } from "@shopify/polaris";
import { useAppBridge } from "@shopify/app-bridge-react";
import { useTranslation } from "react-i18next";

export function ProductsCard() {
  const shopify = useAppBridge();
  const { t } = useTranslation();
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch products data on component mount
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await fetch("/api/getProducts");
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        const data = await response.json();
        setProducts(data);
        setIsLoading(false);
      } catch (error) {
        console.error('Failed to fetch products:', error);
        setError(error);
        setIsLoading(false);
      }
    };

    fetchProducts();
  }, []);

  if (isLoading) return <p>Loading...</p>;
  if (error) return <p>Error loading products: {error.message}</p>;

  return (
    <Card sectioned>
      <TextContainer>
        <Text variant="headingMd" as="h2">
          {t("ProductsCard.title")}
        </Text>
      </TextContainer>
      <div>
        <table style={{ width: "100%" }}>
          <thead>
            <tr>
              <th>ID</th>
              <th>Title</th>
              <th>Image</th>
              <th>Stock</th>
              <th>SKU</th>
              <th>Description</th>
              <th>Metafield 1</th>
              <th>Metafield 2</th>
              <th>Metafield 3</th>
              <th>Metafield 4</th>
              <th>Metafield 5</th>
            </tr>
          </thead>
          <tbody>
            {products.length === 0 ? (
              <tr>
                <td colSpan="11">No products found</td>
              </tr>
            ) : (
              products.map((product) => (
                <tr key={product.id}>
                  <td>{product.id}</td>
                  <td>{product.title}</td>
                  <td>
                    <img src={product.image} alt={product.title} style={{ maxWidth: '100px' }} />
                  </td>
                  <td>{product.stock}</td>
                  <td>{product.sku}</td>
                  <td>{product.description}</td>
                  <td>{product.metafield1}</td>
                  <td>{product.metafield2}</td>
                  <td>{product.metafield3}</td>
                  <td>{product.metafield4}</td>
                  <td>{product.metafield5}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
