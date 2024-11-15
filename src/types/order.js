export const OrderStatus = {
  PENDING: 'pending',
  PROCESSING: 'processing',
  SHIPPED: 'shipped',
  DELIVERED: 'delivered',
  CANCELLED: 'cancelled',
};

export const OrderType = {
  id: String,
  userId: String,
  items: Array,
  total: Number,
  status: String,
  shippingAddress: {
    name: String,
    address: String,
    city: String,
    state: String,
    zipCode: String,
    country: String,
    phone: String,
  },
  createdAt: Date,
  updatedAt: Date,
}; 