import mongoose from 'mongoose';

const stockInwardItemSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
    },
    productName: {
      type: String,
      required: true,
      trim: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
    },
    costPrice: {
      type: Number,
      required: true,
      min: 0,
    },
    lineTotal: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  {
    _id: true,
  }
);

const stockInwardSchema = new mongoose.Schema(
  {
    date: {
      type: Date,
      required: true,
    },
    supplierName: {
      type: String,
      required: true,
      trim: true,
    },
    supplierPhone: {
      type: String,
      trim: true,
      default: '',
    },
    billNumber: {
      type: String,
      trim: true,
      default: '',
    },
    items: {
      type: [stockInwardItemSchema],
      default: [],
    },
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: false,
      default: null,
    },
    quantity: {
      type: Number,
      required: false,
      min: 0,
      default: 0,
    },
    costPrice: {
      type: Number,
      required: false,
      min: 0,
      default: 0,
    },
    totalCost: {
      type: Number,
      required: true,
      min: 0,
    },
    transportCharges: {
      type: Number,
      default: 0,
      min: 0,
    },
    rentCharges: {
      type: Number,
      default: 0,
      min: 0,
    },
    loadingCharges: {
      type: Number,
      default: 0,
      min: 0,
    },
    otherCharges: {
      type: Number,
      default: 0,
      min: 0,
    },
    finalTotalCost: {
      type: Number,
      required: true,
      min: 0,
    },
    paymentStatus: {
      type: String,
      enum: ['Paid', 'Pending', 'Partial'],
      required: true,
      default: 'Pending',
    },
    paidAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    pendingAmount: {
      type: Number,
      default: 0,
      min: 0,
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

stockInwardSchema.index({ date: -1, createdAt: -1 });
stockInwardSchema.index({ supplierName: 1 });
stockInwardSchema.index({ product: 1, createdAt: -1 });
stockInwardSchema.index({ 'items.product': 1, createdAt: -1 });

const StockInward = mongoose.model('StockInward', stockInwardSchema);

export default StockInward;
