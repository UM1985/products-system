import { useEffect, useState } from "react";
import api from "../services/api";
import { useNavigate } from "react-router-dom";

function Dashboard() {
  const [products, setProducts] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [live, setLive] = useState(true);
  const navigate = useNavigate();

  const fetchData = async () => {
    setLoading(true);
    try {
      const [pRes, iRes] = await Promise.all([api.get('/products'), api.get('/invoices')]);
      setProducts(Array.isArray(pRes.data) ? pRes.data : []);
      setInvoices(Array.isArray(iRes.data) ? iRes.data : []);
      setLastUpdated(new Date());
    } catch {
      setProducts([]); setInvoices([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const timer = setInterval(() => { if (live) fetchData(); }, 5000); // 5s
    return () => clearInterval(timer);
  }, [live]);

  const totalProducts = products.length;
  const lowStock = products.filter((p) => Number(p.stock || 0) <= 3).length;
  const totalSales = invoices.filter((inv) => (inv.status || 'Pending') === 'Paid').reduce((s, inv) => s + Number(inv.total || 0), 0);

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-2">
        <h2>Dashboard</h2>
        <div>
          <span className={`badge bg-${live ? 'success' : 'secondary'} me-2`}>{live ? 'Live' : 'Paused'}</span>
          <small className="text-muted me-3">{lastUpdated ? lastUpdated.toLocaleTimeString() : '—'}</small>
          <button className="btn btn-sm btn-outline-light me-2" onClick={fetchData}>Refresh</button>
          <button className="btn btn-sm btn-outline-light" onClick={() => setLive(!live)}>{live ? 'Pause' : 'Resume'}</button>
        </div>
      </div>

      <div className="row mt-2">
        <div className="col-md-4">
          <div role="button" tabIndex={0} onClick={() => navigate('/inventory')} className="card p-3 bg-primary text-white" style={{ cursor: 'pointer' }}>
            <h5>Total Products</h5>
            <h3>{loading ? '—' : totalProducts}</h3>
          </div>
        </div>

        <div className="col-md-4">
          <div role="button" tabIndex={0} onClick={() => navigate('/inventory')} className="card p-3 bg-danger text-white" style={{ cursor: 'pointer' }}>
            <h5>Low Stock</h5>
            <h3>{loading ? '—' : lowStock}</h3>
          </div>
        </div>

        <div className="col-md-4">
          <div role="button" tabIndex={0} onClick={() => navigate('/history')} className="card p-3 bg-success text-white" style={{ cursor: 'pointer' }}>
            <h5>Total Sales</h5>
            <h3>{loading ? '—' : `₹${totalSales}`}</h3>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;