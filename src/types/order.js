export const OrderStatus = {
  PENDING: 'pending',
  PROCESSING: 'processing',
  SHIPPED: 'shipped',
  DELIVERED: 'delivered',
  CANCELLED: 'cancelled',
};

export const ModificationStatus = {
  ALLOWED: 'allowed',
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
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
  isPickupInStore: Boolean,
  selectedStore: String,
  hasInsurance: Boolean,
  insuranceCost: Number,
  shippingCost: Number,
  createdAt: Date,
  updatedAt: Date,
  canModify: Boolean,
  modificationCount: Number,
  maxModificationsAllowed: Number,
  modifications: Array,
  modificationDeadline: Date,
  invoiceTemplate: String,
  invoiceLogoUrl: String,
  invoiceNotes: String,
  invoiceCustomFields: Object,
  invoiceColor: String,
}; 