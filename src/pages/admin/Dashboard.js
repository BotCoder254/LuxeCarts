import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { collection, getDocs, query, where, orderBy } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { FiPackage, FiShoppingBag, FiUsers, FiDollarSign } from 'react-icons/fi';
import { motion } from 'framer-motion';
import moment from 'moment';

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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Fetch products count
        const productsSnap = await getDocs(collection(db, 'products'));
        const productsCount = productsSnap.size;

        // Fetch orders
        const ordersSnap = await getDocs(collection(db, 'orders'));
        const orders = ordersSnap.docs
          .map(doc => ({
            id: doc.id,
            ...doc.data()
          }))
          .filter(order => order.paymentStatus === 'completed');
        const totalRevenue = orders.reduce((sum, order) => sum + order.total, 0);

        // Fetch users count
        const usersSnap = await getDocs(collection(db, 'users'));
        const usersCount = usersSnap.size;

        setStats({
          products: productsCount,
          orders: orders.length,
          users: usersCount,
          revenue: totalRevenue,
        });

        // Set recent orders
        setRecentOrders(
          orders
            .sort((a, b) => b.createdAt.seconds - a.createdAt.seconds)
            .slice(0, 5)
        );
      } catch (error) {
        console.error('Error fetching stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Admin Dashboard</h1>
        <Link
          to="/?preview=true"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          onClick={(e) => {
            e.preventDefault();
            const previewUrl = window.location.origin + '/?preview=true';
            window.open(previewUrl, '_blank', 'noopener,noreferrer');
          }}
        >
          <FiShoppingBag className="mr-2 -ml-1 h-5 w-5" />
          View Store
        </Link>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">Recent Orders</h2>
          <Link
            to="/admin/orders"
            className="text-indigo-600 hover:text-indigo-800"
          >
            View all
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Order ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Customer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {recentOrders.map((order) => (
                <tr key={order.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    #{order.id.slice(-6)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {order.shippingDetails.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {moment(order.createdAt.toDate()).format('MMM DD, YYYY')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      order.status === 'delivered' ? 'bg-green-100 text-green-800' :
                      order.status === 'processing' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {order.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    ${order.total.toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard; 