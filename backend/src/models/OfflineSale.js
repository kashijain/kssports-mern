import mongoose from 'mongoose';

const offlineSaleSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: false,
      default: null,
    },
    rowType: {
      type: String,
      enum: ['product_sale', 'service', 'misc', 'day_status'],
      default: 'product_sale',
    },
    source: {
      type: String,
      enum: ['manual', 'history_import'],
      default: 'manual',
    },
    dayStatus: {
      type: String,
      enum: ['', 'No Sale', 'Holiday', 'Sunday', 'Closed'],
      default: '',
    },
    productName: {
      type: String,
      required: true,
      trim: true,
    },
    saleDate: {
      type: Date,
      required: true,
    },
    quantitySold: {
      type: Number,
      required: false,
      min: 0,
      default: 0,
    },
    salePricePerItem: {
      type: Number,
      required: false,
      min: 0,
      default: 0,
    },
    totalSale: {
      type: Number,
      required: false,
      min: 0,
      default: 0,
    },
    costPricePerItem: {
      type: Number,
      required: false,
      min: 0,
      default: 0,
    },
    totalCost: {
      type: Number,
      required: false,
      min: 0,
      default: 0,
    },
    profit: {
      type: Number,
      required: false,
      default: 0,
    },
    paymentMode: {
      type: String,
      enum: ['', 'Cash', 'Pending', 'Online/UPI'],
      required: false,
      default: '',
    },
    notes: {
      type: String,
      trim: true,
      default: '',
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

const OfflineSale = mongoose.model('OfflineSale', offlineSaleSchema);

export default OfflineSale;
