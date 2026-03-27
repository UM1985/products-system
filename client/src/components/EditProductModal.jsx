import React, { useEffect, useState } from 'react';

export default function EditProductModal({ open, product, onClose, onSave }) {
  const [form, setForm] = useState({ name: '', stock: 0, price: 0 });

  useEffect(() => {
    if (product) setForm({ name: product.name || '', stock: product.stock || 0, price: product.price || 0 });
  }, [product]);

  if (!open) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((s) => ({ ...s, [name]: name === 'name' ? value : Number(value) }));
  };

  const handleSave = () => {
    if (!form.name) return;
    if (Number(form.stock) < 0) {
      alert('Stock cannot be negative');
      return;
    }
    onSave({ ...product, name: form.name.toUpperCase(), stock: Number(form.stock), price: Number(form.price) });
  };

  return (
    <div className="modal show d-block" tabIndex={-1} role="dialog">
      <div className="modal-dialog modal-sm modal-dialog-centered" role="document">
        <div className="modal-content bg-dark text-white">
          <div className="modal-header">
            <h5 className="modal-title">Edit Product</h5>
            <button type="button" className="btn-close btn-close-white" aria-label="Close" onClick={onClose}></button>
          </div>
          <div className="modal-body">
            <div className="mb-2">
              <label className="form-label">Name</label>
              <input name="name" value={form.name} onChange={handleChange} className="form-control" />
            </div>

            <div className="mb-2">
              <label className="form-label">Stock</label>
              <input name="stock" type="number" value={form.stock} onChange={handleChange} className="form-control" />
            </div>

            <div className="mb-2">
              <label className="form-label">Price</label>
              <input name="price" type="number" value={form.price} onChange={handleChange} className="form-control" />
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="button" className="btn btn-primary" onClick={handleSave}>Save</button>
          </div>
        </div>
      </div>
    </div>
  );
}
