import mongoose from 'mongoose';

const inquirySchema = mongoose.Schema(
  {
    customerName: {
      type: String,
      required: true,
      trim: true,
    },
    phoneNumber: {
      type: String,
      required: true,
      trim: true,
    },
    interestedProduct: {
      type: String,
      required: true,
      trim: true,
    },
    budget: {
      type: String,
      trim: true,
      default: '',
    },
    inquiryMessage: {
      type: String,
      required: true,
      trim: true,
    },
    status: {
      type: String,
      enum: ['New', 'Contacted', 'Converted', 'Closed'],
      default: 'New',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Search index on main inquiry fields for admin dashboard filtering
inquirySchema.index({
  customerName: 'text',
  phoneNumber: 'text',
  interestedProduct: 'text',
  inquiryMessage: 'text',
});

const Inquiry = mongoose.model('Inquiry', inquirySchema);
export default Inquiry;
