const mongoose = require('mongoose');

const ItemSchema = new mongoose.Schema({
  name: String,
  quantity: Number,
  price: Number,
});

const InvoiceSchema = new mongoose.Schema(
  {
    customer: String,
    vehicle: String,
    mobile: String,
    date: String,
    items: [ItemSchema],
    total: Number,
    status: { type: String, default: 'Pending' },
    paymentMode: { type: String, default: '' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Invoice', InvoiceSchema);
