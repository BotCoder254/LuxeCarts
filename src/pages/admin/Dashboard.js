import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { collection, getDocs, query, where, orderBy } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { FiPackage, FiShoppingBag, FiUsers, FiDollarSign } from 'react-icons/fi';
import { motion } from 'framer-motion';
import moment from 'moment';
import AdminAnalytics from '../../components/admin/AdminAnalytics';
import InventoryAlerts from '../../components/admin/InventoryAlerts';

const DashboardCard = ({ title, value, icon, link }) => (
  <Link
    to={link}
    className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow"
  >
    <div className="flex items-center justify-between">
      <div>
        <p className="text-gray-500 text-sm">{title}</p>
        <p className="text-2xl font-bold mt-2">{value}</p>
      </div>
      <div className="text-indigo-600 text-3xl">{icon}</div>
    </div>
  </Link>
);

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    products: 0,
    orders: 0,
    users: 0,
    revenue: 0,
  });
  const [recentOrders, setRecentOrders] = useState([]);
  const [allOrders, setAllOrders] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [allProducts, setAllProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Fetch products
        const productsSnap = await getDocs(collection(db, 'products'));
        const productsData = productsSnap.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setAllProducts(productsData);
        const productsCount = productsSnap.size;

        // Fetch users
        const usersSnap = await getDocs(collection(db, 'users'));
        const usersData = usersSnap.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setAllUsers(usersData);

        // Fetch orders
        const ordersSnap = await getDocs(collection(db, 'orders'));
        const orders = ordersSnap.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate() || new Date()
        }));
        setAllOrders(orders);
        
        const completedOrders = orders.filter(order => order.paymentStatus === 'completed');
        const totalRevenue = completedOrders.reduce((sum, order) => sum + order.total, 0);

        setStats({
          products: productsCount,
          orders: completedOrders.length,
          users: usersData.length,
          revenue: totalRevenue,
        });

        // Set recent orders
        const recentOrdersData = [...orders]
          .sort((a, b) => b.createdAt - a.createdAt)
          .slice(0, 5);
        setRecentOrders(recentOrdersData);

        setLoading(false);
      } catch (error) {
        console.error('Error fetching dashboard stats:', error);
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="py-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid grid-cols-1 lg:grid-cols-2 gap-6"
      >
        {/* Inventory Alerts Section */}
        <div className="lg:col-span-2">
          <h2 className="text-2xl font-bold mb-4 text-gray-900">Inventory Alerts</h2>
          <InventoryAlerts />
        </div>

        {/* Analytics Section */}
        <div className="lg:col-span-2">
          <h2 className="text-2xl font-bold mb-4 text-gray-900">Analytics Overview</h2>
          <AdminAnalytics 
            orders={allOrders}
            users={allUsers}
            products={allProducts}
          />
        </div>

        {/* Stats Cards */}
        <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <DashboardCard
            title="Total Products"
            value={stats.products}
            icon={<FiPackage />}
            link="/admin/products"
          />
          <DashboardCard
            title="Total Orders"
            value={stats.orders}
            icon={<FiShoppingBag />}
            link="/admin/orders"
          />
          <DashboardCard
            title="Total Users"
            value={stats.users}
            icon={<FiUsers />}
            link="/admin/users"
          />
          <DashboardCard
            title="Total Revenue"
            value={`$${stats.revenue.toFixed(2)}`}
            icon={<FiDollarSign />}
            link="/admin/orders"
          />
        </div>

        {/* Recent Orders */}
        <div className="lg:col-span-2 bg-white rounded-lg shadow-md overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-800">Recent Orders</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Order ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {recentOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-indigo-600">
                      <Link to={`/admin/orders/${order.id}`}>{order.id.slice(0, 8)}...</Link>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {order.shippingAddress?.name || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      ${order.total.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                        ${order.status === 'delivered' ? 'bg-green-100 text-green-800' : 
                        order.status === 'cancelled' ? 'bg-red-100 text-red-800' : 
                        'bg-yellow-100 text-yellow-800'}`}
                      >
                        {order.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {moment(order.createdAt).format('MMM DD, YYYY')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default AdminDashboard;