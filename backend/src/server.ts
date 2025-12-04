import express from 'express';
import http from 'http';
import cors from 'cors';
import { Server } from 'socket.io';
import sequelize from './db';
import { User } from './models/User';
import { Order } from './models/Order';

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

app.use(cors());
app.use(express.json());

// Test route
app.get('/api', (req, res) => {
  res.json({ message: 'Delivery Management API Running!' });
});

// Create user (for testing)
app.post('/api/users', async (req, res) => {
  try {
    const user = await User.create(req.body);
    res.json(user);
  } catch (error) {
    res.status(400).json({ error: (error as Error).message });
  }
});

// Get all users
app.get('/api/users', async (req, res) => {
  const users = await User.findAll();
  res.json(users);
});



app.post('/api/orders', async (req, res) => {
  try {
    const { items, buyerId } = req.body;

    const order = await Order.create({
      items,
      buyerId: buyerId || null,
      sellerId: 2, // always assign to Seller User (id 2) for demo
      currentStage: 1,
      stageTimestamps: { 1: new Date() },
      actionLog: [`Order created at ${new Date().toISOString()}`],
    });

    io.emit('orderCreated', order);
    res.json(order);
  } catch (error) {
    res.status(400).json({ error: (error as Error).message });
  }
});


// Get all orders
app.get('/api/orders', async (req, res) => {
  const orders = await Order.findAll({ where: { deleted: false } });
  res.json(orders);
});

// Get seller orders
app.get('/api/orders/seller/:sellerId', async (req, res) => {
  const orders = await Order.findAll({
    where: { sellerId: req.params.sellerId, deleted: false },
  });
  res.json(orders);
});

// Next stage
app.post('/api/orders/:id/next-stage', async (req, res) => {
  const order = await Order.findByPk(req.params.id);
  if (!order || order.deleted) return res.status(404).json({ error: 'Order not found' });
  if (order.currentStage >= 7) return res.status(400).json({ error: 'Already delivered' });

  const newStage = order.currentStage + 1;
  order.currentStage = newStage;
  order.stageTimestamps = { ...order.stageTimestamps, [newStage]: new Date() };
  order.actionLog.push(`Stage ${newStage} reached at ${new Date().toISOString()}`);
  order.save();

  io.emit('orderUpdated', order);
  res.json(order);
});

// Associate buyer
app.post('/api/orders/:id/associate-buyer/:buyerId', async (req, res) => {
  const order = await Order.findByPk(req.params.id);
  if (!order) return res.status(404).json({ error: 'Order not found' });

  order.buyerId = parseInt(req.params.buyerId);
  order.currentStage = 2; // Buyer Associated
  order.stageTimestamps = { ...order.stageTimestamps, 2: new Date() };
  order.actionLog.push(`Buyer associated at ${new Date().toISOString()}`);
  await order.save();

  io.emit('orderUpdated', order);
  res.json(order);
});

// Delete order
app.delete('/api/orders/:id', async (req, res) => {
  const order = await Order.findByPk(req.params.id);
  if (!order) return res.status(404).json({ error: 'Order not found' });

  order.deleted = true;
  await order.save();

  io.emit('orderDeleted', { id: order.id });
  res.json({ message: 'Order deleted' });
});

// Socket.IO connection
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

// Sync database and start server
const PORT = process.env.PORT || 5000;
sequelize.sync({ force: true }).then(() => {
  // Create test users
  User.bulkCreate([
    { name: 'Admin User', email: 'admin@test.com', role: 'admin' },
    { name: 'Seller User', email: 'seller@test.com', role: 'seller' },
    { name: 'Buyer User', email: 'buyer@test.com', role: 'buyer' },
  ]);

  server.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
  });
});
