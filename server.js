// backend/server.js
const express = require('express');
const cors = require('cors');
const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json()); // To parse JSON request bodies

// In-memory data (Replace with a database in a real application)
let products = require('./data/products');
let cart = []; // { productId: '1', quantity: 1, name: 'Product Name', price: 100 }
let userWallet = { balance: 1100.00 }; // Initial wallet balance

// --- Product Routes ---
app.get('/api/products', (req, res) => {
    res.json(products);
});

app.get('/api/products/:id', (req, res) => {
    const product = products.find(p => p.id === req.params.id);
    if (product) {
        res.json(product);
    } else {
        res.status(404).json({ message: 'Product not found' });
    }
});

// --- Cart Routes ---
app.get('/api/cart', (req, res) => {
    res.json(cart);
});

app.post('/api/cart/add', (req, res) => {
    const { productId, quantity } = req.body;
    const product = products.find(p => p.id === productId);

    if (!product) {
        return res.status(404).json({ message: 'Product not found' });
    }

    const existingItemIndex = cart.findIndex(item => item.productId === productId);

    if (existingItemIndex > -1) {
        cart[existingItemIndex].quantity += quantity;
    } else {
        cart.push({ productId, name: product.name, price: product.price, quantity, image: product.image });
    }
    res.status(201).json(cart);
});

app.post('/api/cart/remove/:productId', (req, res) => {
    const { productId } = req.params;
    cart = cart.filter(item => item.productId !== productId);
    res.json(cart);
});

app.post('/api/cart/update', (req, res) => {
    const { productId, quantity } = req.body;
    const itemIndex = cart.findIndex(item => item.productId === productId);

    if (itemIndex > -1) {
        if (quantity <= 0) {
            cart.splice(itemIndex, 1); // Remove item if quantity is 0 or less
        } else {
            cart[itemIndex].quantity = quantity;
        }
        res.json(cart);
    } else {
        res.status(404).json({ message: 'Item not in cart' });
    }
});

// --- Wallet Routes ---
app.get('/api/wallet', (req, res) => {
    res.json(userWallet);
});

// --- Checkout Route ---
app.post('/api/checkout', (req, res) => {
    const totalAmount = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

    if (userWallet.balance >= totalAmount) {
        userWallet.balance -= totalAmount;
        const order = {
            orderId: `ORD-${Date.now()}`,
            items: [...cart],
            totalAmount,
            date: new Date().toISOString()
        };
        cart = []; // Clear the cart after successful checkout
        // In a real app, you'd save the order to a database
        res.status(200).json({ message: 'Checkout successful!', order, newBalance: userWallet.balance });
    } else {
        res.status(400).json({ message: 'Insufficient wallet balance.' });
    }
});


app.listen(PORT, () => {
    console.log(`Backend server running on http://localhost:${PORT}`);
});