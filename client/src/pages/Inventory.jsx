import { useForm } from "react-hook-form";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import api from "../services/api";
import ConfirmModal from "../components/ConfirmModal";
import EditProductModal from "../components/EditProductModal";

function Inventory() {
  const { register, handleSubmit, reset } = useForm();
  const [products, setProducts] = useState([]);

  // Load products
  useEffect(() => {
    api.get("products").then((res) => setProducts(res.data)).catch(() => setProducts([]));
  }, []);

  // Save products helper
  const saveProducts = (data) => setProducts(data);

  // Add product
  const onSubmit = (data) => {
    if (Number(data.stock) < 0) {
      toast.error("Stock cannot be negative");
      return;
    }
    const payload = { name: data.name.toUpperCase(), stock: Number(data.stock), price: Number(data.price) };
    api.post("products", payload)
      .then((res) => {
        const returned = res.data;
        // If server returned an existing product (merged), update existing entry
        const idx = products.findIndex((p) => (p._id || p.id) === (returned._id || returned.id));
        if (idx >= 0) {
          const updated = [...products];
          updated[idx] = returned;
          saveProducts(updated);
        } else {
          saveProducts([returned, ...products]);
        }
        toast.success("Product Added");
        reset();
      })
      .catch((err) => {
        toast.error(err?.response?.data?.message || "Failed to add product");
      });
  };

  // Delete product
  const [showConfirm, setShowConfirm] = useState(false);
  const [pendingIndex, setPendingIndex] = useState(null);
  const [editOpen, setEditOpen] = useState(false);
  const [editIndex, setEditIndex] = useState(null);

  const deleteProduct = (index) => {
    setPendingIndex(index);
    setShowConfirm(true);
  };

  const confirmDelete = () => {
    const index = pendingIndex;
    const prod = products[index];
    const id = prod._id || prod.id;
    if (!id) {
      toast.error("Missing product id");
      setShowConfirm(false);
      return;
    }

    api.delete(`/products/${id}`)
      .then(() => {
        const updated = products.filter((_, i) => i !== index);
        saveProducts(updated);
        toast.error("Product Deleted");
      })
      .catch(() => toast.error("Failed to delete"))
      .finally(() => {
        setShowConfirm(false);
        setPendingIndex(null);
      });
  };

  // Update stock
  const updateStock = (index, value) => {
    const prod = products[index];
    const id = prod._id || prod.id;
    const payload = { ...prod, stock: Number(value) };
    api.put(`/products/${id}`, payload)
      .then((res) => {
        const updated = [...products];
        updated[index] = res.data;
        saveProducts(updated);
        if (res.data.stock <= 3) toast.warning(`Low stock for ${res.data.name}`);
      })
      .catch(() => toast.error("Failed to update stock"));
  };

  // Update price
  const updatePrice = (index, value) => {
    const prod = products[index];
    const id = prod._id || prod.id;
    const payload = { ...prod, price: Number(value) };
    api.put(`/products/${id}`, payload)
      .then((res) => {
        const updated = [...products];
        updated[index] = res.data;
        saveProducts(updated);
      })
      .catch(() => toast.error("Failed to update price"));
  };

  // Edit product via modal
  const editProduct = (index) => {
    setEditIndex(index);
    setEditOpen(true);
  };

  const handleEditSave = (updatedProduct) => {
    const id = updatedProduct._id || updatedProduct.id;
    if (!id) return toast.error("Missing product id");
    api.put(`/products/${id}`, updatedProduct)
      .then((res) => {
        const updated = [...products];
        // find by id in case ordering changed
        const idx = updated.findIndex((p) => (p._id || p.id) === (res.data._id || res.data.id));
        if (idx >= 0) updated[idx] = res.data;
        saveProducts(updated);
        toast.success("Product updated");
        setEditOpen(false);
        setEditIndex(null);
      })
      .catch((err) => toast.error(err?.response?.data?.message || "Failed to update product"));
  };

  return (
    <div className="container py-4 text-white" style={{ background: "#1f1f1f" }}>
      <h2>Inventory</h2>

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="card p-3 mt-3 bg-dark">
        <input
          {...register("name", { required: true })}
          placeholder="Product Name"
          className="form-control mb-2"
        />

        <input
          {...register("stock", { required: true })}
          placeholder="Stock"
          type="number"
          className="form-control mb-2"
        />

        <input
          {...register("price", { required: true })}
          placeholder="Price"
          type="number"
          className="form-control mb-2"
        />

        <button className="btn btn-primary">Add Product</button>
      </form>

      {/* Table */}
      <div className="table-responsive">
        <table className="table table-dark mt-4 text-center">
          <thead>
            <tr>
              <th>#</th>
              <th>Name</th>
              <th>Stock</th>
              <th>Price</th>
              <th>❌</th>
            </tr>
          </thead>

          <tbody>
            {products.map((p, i) => (
              <tr key={p._id || i}>
                <td>{i + 1}</td>
                <td>{p.name}</td>

                {/* Editable Stock */}
                <td>
                  <input
                    type="number"
                    value={p.stock}
                    className="form-control text-center"
                    style={{ width: "80px", margin: "auto" }}
                    onChange={(e) => updateStock(i, e.target.value)}
                  />
                </td>

                {/* Editable Price */}
                <td>
                  <input
                    type="number"
                    value={p.price}
                    className="form-control text-center"
                    style={{ width: "100px", margin: "auto" }}
                    onChange={(e) => updatePrice(i, e.target.value)}
                  />
                </td>

                {/* Delete */}
                <td>
                  <div className="d-flex justify-content-center gap-2">
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={() => editProduct(i)}
                    >
                      ✏️
                    </button>

                    <button
                      className="btn btn-danger btn-sm"
                      onClick={() => deleteProduct(i)}
                    >
                      🗑️
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ConfirmModal
        open={showConfirm}
        title="Confirm Delete"
        message="Are you sure you want to delete this product? This action cannot be undone."
        onCancel={() => setShowConfirm(false)}
        onConfirm={confirmDelete}
      />

      <EditProductModal
        open={editOpen}
        product={typeof editIndex === 'number' ? products[editIndex] : null}
        onClose={() => { setEditOpen(false); setEditIndex(null); }}
        onSave={handleEditSave}
      />
    </div>
  );
}

export default Inventory;
