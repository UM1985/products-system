const Product = require('../models/Product.js');

exports.getAll = async (req, res) => {
  try {
    const products = await Product.find().sort({ name: 1 });
    res.json(products);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.create = async (req, res) => {
  try {
    const { name, stock, price } = req.body;
    const existing = await Product.findOne({ name });
    if (existing) {
      // If product exists, increment its stock instead of creating duplicate
      existing.stock = Number(existing.stock || 0) + Number(stock || 0);
      // Optionally update price if provided and different
      if (price !== undefined && price !== null) existing.price = price;
      const updated = await existing.save();
      return res.status(200).json(updated);
    }
    const p = await Product.create({ name, stock, price });
    res.status(201).json(p);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.update = async (req, res) => {
  try {
    const { id } = req.params;
    const update = req.body;
    const p = await Product.findByIdAndUpdate(id, update, { new: true });
    if (!p) return res.status(404).json({ message: 'Not found' });
    res.json(p);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.deleteOne = async (req, res) => {
  try {
    const { id } = req.params;
    const p = await Product.findByIdAndDelete(id);
    if (!p) return res.status(404).json({ message: 'Not found' });
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
