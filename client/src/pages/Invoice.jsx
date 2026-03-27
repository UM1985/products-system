import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import api from "../services/api";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

function Invoice() {
  const [products, setProducts] = useState([]);
  const [invoiceItems, setInvoiceItems] = useState([]);

  const [form, setForm] = useState({
    customer: "",
    vehicle: "",
    mobile: "",
    status: "Pending",
  });

  const [input, setInput] = useState({
    name: "",
    quantity: "",
    price: "",
  });

  // Load products
  useEffect(() => {
    api.get("/products").then((res) => setProducts(res.data)).catch(() => setProducts([]));
  }, []);

  const getProduct = (name) =>
    products.find((p) => p.name.toLowerCase() === name.toLowerCase());

  // Auto price fill
  const handleProductChange = (value) => {
    const product = getProduct(value);
    setInput({
      ...input,
      name: value,
      price: product ? product.price : "",
    });
  };

  // Add item
  const addItem = () => {
    const product = getProduct(input.name);
    const qty = parseInt(input.quantity);

    if (!product || !qty) {
      return toast.error("Invalid product or quantity");
    }
    if (qty < 0) {
      return toast.error("Quantity cannot be negative");
    }
    if (product.stock < qty) {
      return toast.error("Insufficient stock");
    }

    // reduce stock in backend
    const id = product._id || product.id;
    api.put(`/products/${id}`, { ...product, stock: product.stock - qty }).catch(() => toast.error("Failed to update stock"));

    const newItem = {
      name: product.name,
      quantity: qty,
      price: input.price || product.price,
    };

    setInvoiceItems([...invoiceItems, newItem]);

    if (product.stock <= 3) {
      toast.warning(`Low stock: ${product.name}`);
    }

    setInput({ name: "", quantity: "", price: "" });
  };

  // Remove item
  const removeItem = (index) => {
    const item = invoiceItems[index];
    const product = getProduct(item.name);

    if (product) {
      const id = product._id || product.id;
      api.put(`/products/${id}`, { ...product, stock: product.stock + item.quantity }).catch(() => toast.error("Failed to restore stock"));
    }

    setInvoiceItems(invoiceItems.filter((_, i) => i !== index));
  };

  // Update price
  const updatePrice = (index, value) => {
    const newItems = [...invoiceItems];
    newItems[index].price = Number(value);
    setInvoiceItems(newItems);
  };

  // Total
  const total = invoiceItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  const logoPublicUrl = encodeURI('/logo krishna1.JPG');

  // helper: load image URL into a data URL (base64)
  const loadImageAsDataUrl = async (url) => {
    try {
      const res = await fetch(url);
      const blob = await res.blob();
      return await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    } catch (err) {
      return null;
    }
  };

  // Download PDF (embed logo and use a clean printable layout)
  const validateForm = () => {
    if (!form.customer.trim()) {
      toast.error('Customer name is required');
      return false;
    }
    if (!form.vehicle.trim()) {
      toast.error('Vehicle number is required');
      return false;
    }
    if (!form.mobile.trim()) {
      toast.error('Mobile number is required');
      return false;
    }
    // Simple mobile validation: 10 digits
    if (!/^\d{10}$/.test(form.mobile.trim())) {
      toast.error('Mobile number must be 10 digits');
      return false;
    }
    if (invoiceItems.length === 0) {
      toast.error('Add at least one product to the invoice');
      return false;
    }
    return true;
  };

  const downloadInvoice = async () => {
    if (!validateForm()) return;

    const doc = new jsPDF({ unit: 'pt', format: 'a4' });
    const pageW = doc.internal.pageSize.getWidth();
    const pageH = doc.internal.pageSize.getHeight();

    // light butter-paper background
    doc.setFillColor(250, 244, 224);
    doc.rect(0, 0, pageW, pageH, 'F');

    const margin = 40;
    const cardW = pageW - margin * 2;

    // white content card
    doc.setFillColor(255, 255, 255);
    doc.roundedRect(margin, margin, cardW, pageH - margin * 2, 6, 6, 'F');

    // logo
    const logoData = await loadImageAsDataUrl(logoPublicUrl);
    const logoW = 50;
    const logoH = 50;
    if (logoData) {
      try { doc.addImage(logoData, 'JPEG', margin + 12, margin + 12, logoW, logoH); } catch { try { doc.addImage(logoData, 'PNG', margin + 12, margin + 12, logoW, logoH); } catch {} }
    }

    // header text
    const headerX = margin + (logoData ? logoW + 28 : 12);
    doc.setFontSize(18);
    doc.setTextColor(30, 30, 30);
    doc.text('KRISHNA AUTOMOBILE', headerX, margin + 28);
    doc.setFontSize(10);
    doc.text(`Customer: ${form.customer || '-'}`, headerX, margin + 46);
    doc.text(`Vehicle: ${form.vehicle || '-'}`, headerX, margin + 62);
    doc.text(`Mobile: ${form.mobile || '-'}`, headerX, margin + 78);

    // invoice meta box
    const metaW = 160;
    const metaX = margin + cardW - metaW - 12;
    const metaY = margin + 12;
    doc.setFillColor(245,245,245);
    doc.rect(metaX, metaY, metaW, 56, 'F');
    doc.setFontSize(10);
    doc.setTextColor(60,60,60);
    doc.text(`Date: ${new Date().toLocaleDateString()}`, metaX + 8, metaY + 20);
    doc.text(`Status: ${form.status}`, metaX + 8, metaY + 36);

    // table
    autoTable(doc, {
      startY: margin + 120,
      margin: { left: margin + 12, right: margin + 12 },
      head: [["#", "Product", "Qty", "Price", "Total"]],
      body: invoiceItems.map((item, i) => [
        i + 1,
        item.name,
        item.quantity,
        `₹${Number(item.price).toFixed(2)}`,
        `₹${(item.price * item.quantity).toFixed(2)}`,
      ]),
      styles: { fontSize: 10, textColor: 40 },
      headStyles: { fillColor: [40,167,69], textColor: 255 },
      theme: 'grid',
    });

    const finalY = (doc.lastAutoTable && doc.lastAutoTable.finalY) ? doc.lastAutoTable.finalY : margin + 220;

    // totals box
    const totW = 180;
    const totX = margin + cardW - totW - 12;
    const totY = finalY + 12;
    doc.setFillColor(250,250,250);
    doc.rect(totX, totY, totW, 56, 'F');
    doc.setFontSize(12);
    doc.setTextColor(30,30,30);
    doc.text(`Total: ₹${total.toFixed(2)}`, totX + 12, totY + 36);

    doc.save('invoice.pdf');

    // Save to history
    const payload = { ...form, date: new Date().toLocaleDateString(), items: invoiceItems, total };
    api.post('/invoices', payload).catch(() => toast.error('Failed to save invoice'));

    toast.success('Invoice Generated!');
    setInvoiceItems([]);
  };

  return (
    <div className="container py-4 text-white" style={{ background: "#1f1f1f" }}>
      <h2 className="text-center mb-3">Invoice Generator</h2>

      {/* Customer Info */}
      <div className="row mb-3">
        <div className="col-md-3">
          <input className="form-control"
            placeholder="Customer Name"
            onChange={(e) => setForm({ ...form, customer: e.target.value })}
          />
        </div>

        <div className="col-md-3">
          <input className="form-control"
            placeholder="Vehicle Number"
            onChange={(e) => setForm({ ...form, vehicle: e.target.value })}
          />
        </div>

        <div className="col-md-3">
          <input className="form-control"
            placeholder="Mobile"
            onChange={(e) => setForm({ ...form, mobile: e.target.value })}
          />
        </div>

        <div className="col-md-3">
          <select className="form-control"
            onChange={(e) => setForm({ ...form, status: e.target.value })}>
            <option>Pending</option>
            <option>Paid</option>
          </select>
        </div>
      </div>

      {/* Add Product */}
      <div className="row mb-3">
        <div className="col-md-4">
          <input
            list="products"
            className="form-control"
            placeholder="Product"
            value={input.name}
            onChange={(e) => handleProductChange(e.target.value)}
          />
          <datalist id="products">
            {products.map((p, i) => (
              <option key={i} value={p.name} />
            ))}
          </datalist>
        </div>

        <div className="col-md-2">
          <input type="number"
            className="form-control"
            placeholder="Qty"
            value={input.quantity}
            onChange={(e) => setInput({ ...input, quantity: e.target.value })}
          />
        </div>

        <div className="col-md-2">
          <input type="number"
            className="form-control"
            placeholder="Price"
            value={input.price}
            onChange={(e) => setInput({ ...input, price: e.target.value })}
          />
        </div>

        <div className="col-md-4">
          <button className="btn btn-success w-100" onClick={addItem}>
            Add to Invoice
          </button>
        </div>
      </div>

      {/* Preview */}
      <div className="invoice-preview invoice-preview-dark mb-3">
        <div className="invoice-header">
          <img src={logoPublicUrl} alt="logo" className="invoice-logo" style={{ filter: 'brightness(0) invert(1)' }} />
          <div>
            <div className="invoice-company">KRISHNA AUTOMOBILE</div>
            <div style={{ fontSize: 12, color: '#444' }}>{form.customer || 'Customer name'}</div>
          </div>
          <div className="invoice-meta">
            <div>Date: {new Date().toLocaleDateString()}</div>
            <div>Status: {form.status}</div>
          </div>
        </div>

        <table className="invoice-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Product</th>
              <th>Qty</th>
              <th>Price</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            {invoiceItems.map((it, idx) => (
              <tr key={idx}>
                <td>{idx + 1}</td>
                <td>{it.name}</td>
                <td>{it.quantity}</td>
                <td>₹{Number(it.price).toFixed(2)}</td>
                <td>₹{(it.price * it.quantity).toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="invoice-total">Grand Total: ₹{total.toFixed(2)}</div>
      </div>

      {/* Table */}
      <table className="table table-dark text-center">
        <thead>
          <tr>
            <th>#</th>
            <th>Product</th>
            <th>Qty</th>
            <th>Price</th>
            <th>Total</th>
            <th>❌</th>
          </tr>
        </thead>

        <tbody>
          {invoiceItems.map((item, i) => (
            <tr key={i}>
              <td>{i + 1}</td>
              <td>{item.name}</td>
              <td>{item.quantity}</td>
              <td>
                <input
                  type="number"
                  value={item.price}
                  onChange={(e) => updatePrice(i, e.target.value)}
                />
              </td>
              <td>₹{item.price * item.quantity}</td>
              <td>
                <button className="btn btn-danger btn-sm" onClick={() => removeItem(i)}>
                  ❌
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <h5 className="text-end">Grand Total: ₹{total}</h5>

      <div className="text-center">
        <button className="btn btn-primary" onClick={downloadInvoice}>
          Download Invoice
        </button>
      </div>
    </div>
  );
}

export default Invoice;