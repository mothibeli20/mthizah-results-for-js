import React, { useState, useEffect } from 'react';

const Inventory = () => {
    const [products, setProducts] = useState([]);
    const [productName, setProductName] = useState('');
    const [productDescription, setProductDescription] = useState('');
    const [productCategory, setProductCategory] = useState('');
    const [productPrice, setProductPrice] = useState('');
    const [productQuantity, setProductQuantity] = useState('');
    const [editingProductIndex, setEditingProductIndex] = useState(null);

    // State for selling and adding stock
    const [selectedProductId, setSelectedProductId] = useState(null);
    const [sellQuantity, setSellQuantity] = useState('');
    const [sellPrice, setSellPrice] = useState('');
    const [addQuantity, setAddQuantity] = useState('');
    
    // To hold stock transactions
    const [transactions, setTransactions] = useState([]);

    const fetchProducts = async () => {
        try {
            const response = await fetch('http://localhost:5001/products');
            const data = await response.json();
            const normalizedProducts = data.map(product => ({
                ...product,
                price: parseFloat(product.price) || 0,
                quantity: parseInt(product.quantity) || 0
            }));
            setProducts(normalizedProducts);
        } catch (error) {
            console.error('Error fetching products:', error);
        }
    };

    useEffect(() => {
        fetchProducts();
    }, []);

    const handleAddOrUpdateProduct = async () => {
        const updatedProduct = {
            name: productName,
            description: productDescription,
            category: productCategory,
            price: parseFloat(productPrice) || 0,
            quantity: parseInt(productQuantity) || 0
        };

        if (editingProductIndex !== null) {
            const productId = products[editingProductIndex].id;
            await fetch(`http://localhost:5001/products/${productId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updatedProduct),
            });
        } else {
            await fetch('http://localhost:5001/products', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updatedProduct),
            });
        }

        fetchProducts();
        resetFields();
    };

    const handleEditProduct = (index) => {
        const product = products[index];
        setProductName(product.name);
        setProductDescription(product.description);
        setProductCategory(product.category);
        setProductPrice(product.price);
        setProductQuantity(product.quantity);
        setEditingProductIndex(index);
    };

    const handleDeleteProduct = async (index) => {
        const productId = products[index].id;
        await fetch(`http://localhost:5001/products/${productId}`, { method: 'DELETE' });
        fetchProducts();
    };

    // Select a product for transactions
    const selectProduct = (productId) => {
        setSelectedProductId(productId);
        const product = products.find(p => p.id === productId);
        if (product) {
            setSellPrice(product.price); // Set the price
            setAddQuantity('');
            setSellQuantity('');
        }
    };

    const sellStock = async () => {
        if (selectedProductId === null) {
            alert("Please select a product to sell.");
            return;
        }

        const product = products.find(p => p.id === selectedProductId);
        const quantityToSell = parseInt(sellQuantity);

        if (quantityToSell > product.quantity) {
            alert("Cannot sell more than available stock");
            return;
        }

        // Update quantity in the product
        const updatedProduct = {
            ...product,
            quantity: product.quantity - quantityToSell,
        };

        await fetch(`http://localhost:5001/products/${product.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updatedProduct),
        });

        // Ensure sellPrice is a number before using it
        const sellPriceNumber = parseFloat(sellPrice);
        
        // Record the transaction
        const transaction = {
            productId: product.id,
            productName: product.name,
            quantity: quantityToSell,
            price: sellPriceNumber, // Ensure this is a number
            remainingPrice: sellPriceNumber - (product.price * quantityToSell),
            date: new Date().toLocaleString(),
            type: 'Sale'
        };

        setTransactions(prev => [...prev, transaction]);
        setSellQuantity('');
        setSelectedProductId(null); // Reset selection
        fetchProducts();
    };

    const addStock = async () => {
        if (selectedProductId === null) {
            alert("Please select a product to add stock.");
            return;
        }

        const product = products.find(p => p.id === selectedProductId);
        const quantityToAdd = parseInt(addQuantity);

        // Update product quantity
        const updatedProduct = {
            ...product,
            quantity: product.quantity + quantityToAdd,
        };

        await fetch(`http://localhost:5001/products/${product.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updatedProduct),
        });

        // Record the transaction
        const transaction = {
            productId: product.id,
            productName: product.name,
            quantity: quantityToAdd,
            price: product.price, // Assuming price remains constant
            date: new Date().toLocaleString(),
            type: 'Addition'
        };

        setTransactions(prev => [...prev, transaction]);
        setAddQuantity('');
        setSelectedProductId(null); // Reset selection
        fetchProducts();
    };

    const resetFields = () => {
        setProductName('');
        setProductDescription('');
        setProductCategory('');
        setProductPrice('');
        setProductQuantity('');
        setEditingProductIndex(null);
    };

    return (
        <div className="inventory-container">
            <h3>{editingProductIndex !== null ? 'Update Product' : 'Add Product'}</h3>
            <input
                type="text"
                value={productName}
                onChange={(e) => setProductName(e.target.value)}
                placeholder="Product Name"
            />
            <input
                type="text"
                value={productDescription}
                onChange={(e) => setProductDescription(e.target.value)}
                placeholder="Product Description"
            />
            <input
                type="text"
                value={productCategory}
                onChange={(e) => setProductCategory(e.target.value)}
                placeholder="Product Category"
            />
            <input
                type="number"
                value={productPrice}
                onChange={(e) => setProductPrice(e.target.value)}
                placeholder="Product Price"
            />
            <input
                type="number"
                value={productQuantity}
                onChange={(e) => setProductQuantity(e.target.value)}
                placeholder="Initial Quantity"
            />
            <button onClick={handleAddOrUpdateProduct}>
                {editingProductIndex !== null ? 'Update Product' : 'Add Product'}
            </button>

            <h3>Products</h3>
            <div className="product-list">
                {products.length === 0 ? (
                    <p>No products available. Please add a product.</p>
                ) : (
                    <table className="product-table">
                        <thead>
                            <tr>
                                <th>Select</th>
                                <th>Product Name</th>
                                <th>Description</th>
                                <th>Category</th>
                                <th>Price</th>
                                <th>Quantity</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {products.map((product, index) => (
                                <tr key={index}>
                                    <td>
                                        <input 
                                            type="radio" 
                                            name="product" 
                                            onChange={() => selectProduct(product.id)} 
                                            checked={selectedProductId === product.id} 
                                        />
                                    </td>
                                    <td>{product.name}</td>
                                    <td>{product.description}</td>
                                    <td>{product.category}</td>
                                    <td>R{(product.price).toFixed(2)}</td>
                                    <td>{product.quantity}</td>
                                    <td>
                                        <button onClick={() => handleEditProduct(index)}>Edit</button>
                                        <button onClick={() => handleDeleteProduct(index)}>Delete</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
            
            <h3>Manage Stock</h3>
            <div>
                <h4>Sell Stock</h4>
                <input
                    type="number"
                    value={sellQuantity}
                    onChange={(e) => setSellQuantity(e.target.value)}
                    placeholder="Quantity to Sell"
                />
                <input
                    type="number"
                    value={sellPrice}
                    onChange={(e) => setSellPrice(e.target.value)}
                    placeholder="Sell Price"
                />
                <button onClick={sellStock}>Sell Stock</button>
            </div>
            <div>
                <h4>Add Stock</h4>
                <input
                    type="number"
                    value={addQuantity}
                    onChange={(e) => setAddQuantity(e.target.value)}
                    placeholder="Quantity to Add"
                />
                <button onClick={addStock}>Add Stock</button>
            </div>

            <h3>Stock Transactions</h3>
            <div className="transaction-list">
                {transactions.length === 0 ? (
                    <p>No stock transactions available.</p>
                ) : (
                    <table className="transaction-table">
                        <thead>
                            <tr>
                                <th>Product Name</th>
                                <th>Quantity</th>
                                <th>Price</th>
                                <th>Remaining Price</th>
                                <th>Date</th>
                                <th>Type</th>
                            </tr>
                        </thead>
                        <tbody>
                            {transactions.map((transaction, index) => (
                                <tr key={index}>
                                    <td>{transaction.productName}</td>
                                    <td>{transaction.quantity}</td>
                                    <td>R{(transaction.price).toFixed(2)}</td>
                                    {transaction.type === 'Sale' ? (
                                        <td>R{(transaction.remainingPrice).toFixed(2)}</td>
                                    ) : (
                                        <td>-</td> // No remaining price for additions
                                    )}
                                    <td>{transaction.date}</td>
                                    <td>{transaction.type}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
};

export default Inventory;