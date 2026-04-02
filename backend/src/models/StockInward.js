import mongoose from 'mongoose';

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
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
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

const StockInward = mongoose.model('StockInward', stockInwardSchema);

export default StockInward;
