import React, { useState, useEffect } from 'react';
import io from 'socket.io-client';
import './App.css';
import { getUser, logoutUser } from './auth';
import AuthScreen from './AuthScreen';

const socket = io('http://localhost:5000');
const stages = [
  'Order Placed',
  'Buyer Associated',
  'Processing',
  'Packed',
  'Shipped',
  'Out for Delivery',
  'Delivered'
];

function App() {
  const [user, setUser] = useState(getUser());           // logged in user
  const [role, setRole] = useState(user?.role || 'buyer');
  const [orders, setOrders] = useState([]);
  const [users, setUsers] = useState([]);

  // load data + socket listeners
  useEffect(() => {
    fetchUsers();
    fetchOrders();

    if (user) {
      setRole(user.role);
    }

    socket.on('orderCreated', (order) => {
      setOrders((prev) => [...prev, order]);
    });
    socket.on('orderUpdated', (order) => {
      setOrders((prev) => prev.map((o) => (o.id === order.id ? order : o)));
    });
    socket.on('orderDeleted', ({ id }) => {
      setOrders((prev) => prev.filter((o) => o.id !== id));
    });

    return () => {
      socket.off('orderCreated');
      socket.off('orderUpdated');
      socket.off('orderDeleted');
    };
  }, [user]);

  const fetchOrders = async () => {
    const res = await fetch('/api/orders');
    const data = await res.json();
    setOrders(data);
  };

  const fetchUsers = async () => {
    const res = await fetch('/api/users');
    const data = await res.json();
    setUsers(data);
  };

  // create order – attach buyerId if logged in buyer
  const createOrder = async (items) => {
    const body = user && user.role === 'buyer'
      ? { items, buyerId: user.id }
      : { items };

    await fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  };

  const nextStage = async (id) => {
    await fetch(`/api/orders/${id}/next-stage`, { method: 'POST' });
  };

  const associateBuyer = async (orderId, buyerId) => {
    await fetch(`/api/orders/${orderId}/associate-buyer/${buyerId}`, {
      method: 'POST',
    });
  };

  const deleteOrder = async (id) => {
    await fetch(`/api/orders/${id}`, { method: 'DELETE' });
  };

  // if not logged in, show AuthScreen
  if (!user) {
    return <AuthScreen onLogin={setUser} />;
  }

  return (
    <div className="App">
      <header>
        <h1>🚚 Delivery Management System</h1>
        <div>
          <span style={{ marginRight: 10 }}>
            {user.name} ({role})
          </span>
          <button
            onClick={() => {
              logoutUser();
              setUser(null);
            }}
            className="btn-primary"
          >
            Logout
          </button>
        </div>
      </header>

      {role === 'buyer' && (
        <BuyerDashboard
          orders={orders}
          onCreateOrder={createOrder}
          user={user}
        />
      )}
      {role === 'seller' && (
        <SellerDashboard
          orders={orders}
          onNextStage={nextStage}
          onDelete={deleteOrder}
          user={user}
        />
      )}
      {role === 'admin' && (
        <AdminDashboard
          orders={orders}
          users={users}
          onNextStage={nextStage}
          onAssociateBuyer={associateBuyer}
          onDelete={deleteOrder}
        />
      )}
    </div>
  );
}

// Buyer Dashboard
function BuyerDashboard({ orders, onCreateOrder, user }) {
  const [showModal, setShowModal] = useState(false);
  const [items, setItems] = useState([]);

  // orders for this buyer
  const buyerOrders = orders.filter(
    (o) => o.buyerId === user.id && !o.deleted
  );

  // only one active order rule
  const activeOrders = buyerOrders.filter((o) => o.currentStage < 7);

  const addItem = () => setItems([...items, '']);
  const updateItem = (index, value) => {
    const newItems = [...items];
    newItems[index] = value;
    setItems(newItems);
  };

  const createOrderHandler = () => {
    if (activeOrders.length > 0) {
      alert('You already have one active order. Finish it before creating another.');
      return;
    }
    const cleaned = items.filter((item) => item.trim());
    if (cleaned.length === 0) {
      alert('Please add at least one item.');
      return;
    }
    onCreateOrder(cleaned);
    setShowModal(false);
    setItems([]);
  };

  return (
    <div>
      <h2>👤 Buyer Dashboard</h2>
      <button onClick={() => setShowModal(true)} className="btn-primary">
        Create New Order
      </button>

      {showModal && (
        <div className="modal">
          <div className="modal-content">
            <h3>Add Items</h3>
            {items.map((item, index) => (
              <input
                key={index}
                value={item}
                onChange={(e) => updateItem(index, e.target.value)}
                placeholder="Item name"
              />
            ))}
            <button onClick={addItem}>Add Item</button>
            <button onClick={createOrderHandler}>Make Order</button>
            <button onClick={() => setShowModal(false)}>Cancel</button>
          </div>
        </div>
      )}

      <div className="orders-grid">
        {buyerOrders.map((order) => (
          <OrderCard key={order.id} order={order} />
        ))}
      </div>
    </div>
  );
}

// Seller Dashboard
function SellerDashboard({ orders, onNextStage, onDelete, user }) {
  // only this seller's orders
  const sellerOrders = orders.filter(
    (o) => o.sellerId === user.id && !o.deleted
  );

  return (
    <div>
      <h2>🏪 Seller Dashboard</h2>
      <table className="orders-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Stage</th>
            <th>Items</th>
            <th>Buyer</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {sellerOrders.map((order) => (
            <tr key={order.id}>
              <td>{order.id}</td>
              <td>{stages[order.currentStage - 1]}</td>
              <td>{order.items.join(', ')}</td>
              <td>{order.buyerId || 'No buyer'}</td>
              <td>
                <button
                  onClick={() => onNextStage(order.id)}
                  disabled={order.currentStage >= 7}
                >
                  Next Stage
                </button>
                <button
                  onClick={() => onDelete(order.id)}
                  className="btn-danger"
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// Admin Dashboard
function AdminDashboard({
  orders,
  users,
  onNextStage,
  onAssociateBuyer,
  onDelete,
}) {
  const [stats, setStats] = useState({});
  const [selectedOrder, setSelectedOrder] = useState(null);

  useEffect(() => {
    const stageCount = {};
    orders.forEach((o) => {
      stageCount[o.currentStage] = (stageCount[o.currentStage] || 0) + 1;
    });
    setStats({
      total: orders.length,
      stages: stageCount,
    });
  }, [orders]);

  const getStageDurationText = (order) => {
    const ts = order.stageTimestamps || {};
    const lines = [];
    for (let i = 1; i < 7; i++) {
      if (ts[i] && ts[i + 1]) {
        const start = new Date(ts[i]);
        const end = new Date(ts[i + 1]);
        const diffMs = end.getTime() - start.getTime();
        const mins = Math.round(diffMs / 60000);
        lines.push(`${stages[i - 1]} → ${stages[i]}: ${mins} min`);
      }
    }
    return lines;
  };

  return (
    <div>
      <h2>⚙️ Admin Dashboard</h2>

      <div className="stats">
        <div>Total Orders: {stats.total}</div>
        {Object.entries(stats.stages || {}).map(([stage, count]) => (
          <div key={stage}>
            Stage {stage}: {count}
          </div>
        ))}
      </div>

      <table className="orders-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Stage</th>
            <th>Buyer</th>
            <th>Seller</th>
            <th>Items</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {orders
            .filter((o) => !o.deleted)
            .map((order) => (
              <tr key={order.id}>
                <td>{order.id}</td>
                <td>{stages[order.currentStage - 1]}</td>
                <td>{order.buyerId || 'No buyer'}</td>
                <td>{order.sellerId || 'No seller'}</td>
                <td>{order.items.join(', ')}</td>
                <td>
                  {!order.buyerId && (
                    <select
                      onChange={(e) =>
                        e.target.value &&
                        onAssociateBuyer(order.id, e.target.value)
                      }
                    >
                      <option value="">Associate Buyer</option>
                      {users
                        .filter((u) => u.role === 'buyer')
                        .map((u) => (
                          <option key={u.id} value={u.id}>
                            {u.name}
                          </option>
                        ))}
                    </select>
                  )}
                  <button
                    onClick={() => onNextStage(order.id)}
                    disabled={order.currentStage >= 7}
                  >
                    Next
                  </button>
                  <button onClick={() => onDelete(order.id)}>Delete</button>
                  <button onClick={() => setSelectedOrder(order)}>
                    View Details
                  </button>
                </td>
              </tr>
            ))}
        </tbody>
      </table>

      {selectedOrder && (
        <div className="modal">
          <div className="modal-content">
            <h3>Order #{selectedOrder.id} Details</h3>
            {selectedOrder.stageTimestamps?.[1] && (
              <p>
                Started at:{' '}
                {new Date(
                  selectedOrder.stageTimestamps[1]
                ).toLocaleString()}
              </p>
            )}
            <h4>Stage Durations</h4>
            <ul>
              {getStageDurationText(selectedOrder).map((line, idx) => (
                <li key={idx}>{line}</li>
              ))}
            </ul>
            <h4>Action Log</h4>
            <pre style={{ whiteSpace: 'pre-wrap' }}>
              {(selectedOrder.actionLog || []).join('\n')}
            </pre>
            <button onClick={() => setSelectedOrder(null)}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
}

function OrderCard({ order }) {
  return (
    <div className="order-card">
      <h3>Order #{order.id}</h3>
      <div className="progress-container">
        <div className="progress-bar">
          {stages.map((stage, index) => (
            <div
              key={index}
              className={`progress-step ${
                index < order.currentStage ? 'completed' : ''
              }`}
            >
              {stage}
            </div>
          ))}
        </div>
        <div>Current: {stages[order.currentStage - 1]}</div>
      </div>
      <div>Items: {order.items.join(', ')}</div>
    </div>
  );
}

export default App;



// import React, { useState, useEffect } from 'react';
// import io from 'socket.io-client';
// import './App.css';
// import { getUser, logoutUser } from './auth';
// import AuthScreen from './AuthScreen';


// const socket = io('http://localhost:5000');
// const stages = ['Order Placed', 'Buyer Associated', 'Processing', 'Packed', 'Shipped', 'Out for Delivery', 'Delivered'];

// function App() {
//   const [user, setUser] = useState(getUser()); 
//   const [role, setRole] = useState(user?.role || 'buyer');
//  // const [role, setRole] = useState('admin');
//   const [orders, setOrders] = useState([]);
//   const [users, setUsers] = useState([]);

//   useEffect(() => {
//     // Fetch initial data
//     fetchUsers();
//     fetchOrders();
//      if (user) {
//       setRole(user.role);
//     }
//   //  },[user]);

//     // Real-time listeners
//     socket.on('orderCreated', (order) => {
//       setOrders(prev => [...prev, order]);
//     });
//     socket.on('orderUpdated', (order) => {
//       setOrders(prev => prev.map(o => o.id === order.id ? order : o));
//     });
//     socket.on('orderDeleted', ({ id }) => {
//       setOrders(prev => prev.filter(o => o.id !== id));
//     });

//     return () => {
//       socket.off('orderCreated');
//       socket.off('orderUpdated');
//       socket.off('orderDeleted');
//     };
//   }, []);

//   const fetchOrders = async () => {
//     const res = await fetch('/api/orders');
//     const data = await res.json();
//     setOrders(data);
//   };

//   const fetchUsers = async () => {
//     const res = await fetch('/api/users');
//     const data = await res.json();
//     setUsers(data);
//   };

//   const createOrder = async (items) => {
//     await fetch('/api/orders', {
//       method: 'POST',
//       headers: { 'Content-Type': 'application/json' },
//       body: JSON.stringify({ items }),
//     });
//   };

//   const nextStage = async (id) => {
//     await fetch(`/api/orders/${id}/next-stage`, { method: 'POST' });
//   };

//   const associateBuyer = async (orderId, buyerId) => {
//     await fetch(`/api/orders/${orderId}/associate-buyer/${buyerId}`, { method: 'POST' });
//   };

//   const deleteOrder = async (id) => {
//     await fetch(`/api/orders/${id}`, { method: 'DELETE' });
//   };

//   return (
//     <div className="App">
//       <header>
//         <h1>🚚 Delivery Management System</h1>
//         <select onChange={(e) => setRole(e.target.value)} value={role}>
//           <option value="buyer">Buyer</option>
//           <option value="seller">Seller</option>
//           <option value="admin">Admin</option>
//         </select>
//       </header>

//       {role === 'buyer' && (
//         <BuyerDashboard orders={orders} onCreateOrder={createOrder} />
//       )}
//       {role === 'seller' && (
//         <SellerDashboard orders={orders} onNextStage={nextStage} onDelete={deleteOrder} />
//       )}
//       {role === 'admin' && (
//         <AdminDashboard 
//           orders={orders} 
//           users={users}
//           onNextStage={nextStage}
//           onAssociateBuyer={associateBuyer}
//           onDelete={deleteOrder}
//         />
//       )}
//     </div>
//   );
// }

// // Buyer Dashboard
// function BuyerDashboard({ orders, onCreateOrder }) {
//   const [showModal, setShowModal] = useState(false);
//   const [items, setItems] = useState([]);

//   const addItem = () => setItems([...items, '']);
//   const updateItem = (index, value) => {
//     const newItems = [...items];
//     newItems[index] = value;
//     setItems(newItems);
//   };
//   const createOrderHandler = () => {
//     onCreateOrder(items.filter(item => item.trim()));
//     setShowModal(false);
//     setItems([]);
//   };

//   const buyerOrders = orders.filter(o => o.buyerId);

//   return (
//     <div>
//       <h2>👤 Buyer Dashboard</h2>
//       <button onClick={() => setShowModal(true)} className="btn-primary">
//         Create New Order
//       </button>

//       {showModal && (
//         <div className="modal">
//           <div className="modal-content">
//             <h3>Add Items</h3>
//             {items.map((item, index) => (
//               <input
//                 key={index}
//                 value={item}
//                 onChange={(e) => updateItem(index, e.target.value)}
//                 placeholder="Item name"
//               />
//             ))}
//             <button onClick={addItem}>Add Item</button>
//             <button onClick={createOrderHandler}>Make Order</button>
//             <button onClick={() => setShowModal(false)}>Cancel</button>
//           </div>
//         </div>
//       )}

//       <div className="orders-grid">
//         {buyerOrders.map(order => (
//           <OrderCard key={order.id} order={order} />
//         ))}
//       </div>
//     </div>
//   );
// }

// // Seller Dashboard
// function SellerDashboard({ orders, onNextStage, onDelete }) {
//   const sellerOrders = orders.filter(o => o.sellerId);

//   return (
//     <div>
//       <h2>🏪 Seller Dashboard</h2>
//       <table className="orders-table">
//         <thead>
//           <tr>
//             <th>ID</th>
//             <th>Stage</th>
//             <th>Items</th>
//             <th>Buyer</th>
//             <th>Actions</th>
//           </tr>
//         </thead>
//         <tbody>
//           {sellerOrders.map(order => (
//             <tr key={order.id}>
//               <td>{order.id}</td>
//               <td>{stages[order.currentStage - 1]}</td>
//               <td>{order.items.join(', ')}</td>
//               <td>{order.buyerId || 'No buyer'}</td>
//               <td>
//                 <button 
//                   onClick={() => onNextStage(order.id)}
//                   disabled={order.currentStage >= 7}
//                 >
//                   Next Stage
//                 </button>
//                 <button onClick={() => onDelete(order.id)} className="btn-danger">
//                   Delete
//                 </button>
//               </td>
//             </tr>
//           ))}
//         </tbody>
//       </table>
//     </div>
//   );
// }

// // Admin Dashboard
// function AdminDashboard({ orders, users, onNextStage, onAssociateBuyer, onDelete }) {
//   const [stats, setStats] = useState({});

//   useEffect(() => {
//     const stageCount = {};
//     orders.forEach(o => {
//       stageCount[o.currentStage] = (stageCount[o.currentStage] || 0) + 1;
//     });
//     setStats({
//       total: orders.length,
//       stages: stageCount,
//     });
//   }, [orders]);

//   return (
//     <div>
//       <h2>⚙️ Admin Dashboard</h2>
      
//       <div className="stats">
//         <div>Total Orders: {stats.total}</div>
//         {Object.entries(stats.stages || {}).map(([stage, count]) => (
//           <div key={stage}>Stage {stage}: {count}</div>
//         ))}
//       </div>

//       <table className="orders-table">
//         <thead>
//           <tr>
//             <th>ID</th>
//             <th>Stage</th>
//             <th>Buyer</th>
//             <th>Seller</th>
//             <th>Items</th>
//             <th>Actions</th>
//           </tr>
//         </thead>
//         <tbody>
//           {orders.map(order => (
//             <tr key={order.id}>
//               <td>{order.id}</td>
//               <td>{stages[order.currentStage - 1]}</td>
//               <td>{order.buyerId || 'No buyer'}</td>
//               <td>{order.sellerId || 'No seller'}</td>
//               <td>{order.items.join(', ')}</td>
//               <td>
//                 {!order.buyerId && (
//                   <select onChange={(e) => e.target.value && onAssociateBuyer(order.id, e.target.value)}>
//                     <option value="">Associate Buyer</option>
//                     {users.map(user => (
//                       <option key={user.id} value={user.id}>{user.name}</option>
//                     ))}
//                   </select>
//                 )}
//                 <button onClick={() => onNextStage(order.id)} disabled={order.currentStage >= 7}>
//                   Next
//                 </button>
//                 <button onClick={() => onDelete(order.id)}>Delete</button>
//               </td>
//             </tr>
//           ))}
//         </tbody>
//       </table>
//     </div>
//   );
// }

// function OrderCard({ order }) {
//   return (
//     <div className="order-card">
//       <h3>Order #{order.id}</h3>
//       <div className="progress-container">
//         <div className="progress-bar">
//           {stages.map((stage, index) => (
//             <div
//               key={index}
//               className={`progress-step ${index < order.currentStage ? 'completed' : ''}`}
//             >
//               {stage}
//             </div>
//           ))}
//         </div>
//         <div>Current: {stages[order.currentStage - 1]}</div>
//       </div>
//       <div>Items: {order.items.join(', ')}</div>
//     </div>
//   );
// }

// export default App;
