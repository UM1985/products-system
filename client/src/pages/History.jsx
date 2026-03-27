import { useEffect, useState, useMemo } from "react";
import { Modal, Button } from "react-bootstrap";
import { Pie } from "react-chartjs-2";
import "chart.js/auto";
import api from "../services/api";
import { toast } from "react-toastify";
import ConfirmModal from "../components/ConfirmModal";


function History() {
  const [historyData, setHistoryData] = useState([]);
  const [filters, setFilters] = useState({
    date: "",
    mode: "",
    status: "",
    search: "",
  });

  const [showModal, setShowModal] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [recentlyDeleted, setRecentlyDeleted] = useState(null);

  // For delete confirmation
  const [showConfirm, setShowConfirm] = useState(false);
  const [deleteIndex, setDeleteIndex] = useState(null);

  // Load data
  useEffect(() => {
    api.get("/invoices").then((res) => {
      setHistoryData(res.data);
    }).catch(() => {
      setHistoryData([]);
    });
  }, []);

  // Derived filtered data
  const filteredData = useMemo(() => {
    let data = [...historyData];

    data = data.filter((entry) => {
      return (
        (!filters.date || entry.date === filters.date) &&
        (!filters.status || entry.status === filters.status) &&
        (!filters.mode || entry.paymentMode === filters.mode) &&
        (!filters.search ||
          entry.customer.toUpperCase().includes(filters.search.toUpperCase()) ||
          entry.mobile.includes(filters.search))
      );
    });

    return data;
  }, [filters, historyData]);

  // Summary Calculation
  const getSummary = () => {
    let cash = 0,
      online = 0,
      pending = 0;

    filteredData.forEach((e) => {
      if (e.status === "Paid") {
        if (e.paymentMode === "Cash") cash += e.total;
        if (e.paymentMode === "Online") online += e.total;
      } else {
        pending += e.total;
      }
    });

    return { cash, online, pending };
  };

  const summary = getSummary();


  // Delete + Undo
  const handleDeleteClick = (index) => {
    setDeleteIndex(index);
    setShowConfirm(true);
  };

  const confirmDelete = () => {
    if (deleteIndex === null) return;
    const invoice = filteredData[deleteIndex];
    setRecentlyDeleted({ data: invoice, index: deleteIndex });
    api.delete(`/invoices/${invoice._id || invoice.id}`)
      .then(() => {
        const id = invoice._id || invoice.id;
        const newData = historyData.filter((h) => (h._id || h.id) !== id);
        setHistoryData(newData);
      })
      .catch(() => toast.error("Failed to delete"));
    setShowConfirm(false);
    setDeleteIndex(null);
  };

  const cancelDelete = () => {
    setShowConfirm(false);
    setDeleteIndex(null);
  };

  const undoDelete = () => {
    if (recentlyDeleted) {
      // Undo not implemented server-side; re-fetch invoices
      api.get("/invoices").then((res) => {
        setHistoryData(res.data);
        setRecentlyDeleted(null);
      });
    }
  };

  // Chart Data
  const chartData = {
    labels: ["Cash", "Online", "Pending"],
    datasets: [
      {
        data: [summary.cash, summary.online, summary.pending],
        backgroundColor: ["#28a745", "#007bff", "#ffc107"],
      },
    ],
  };

  return (
    <div className="container py-4 text-white" style={{ background: "#1f1f1f" }}>
      
  

      {/* Filters */}
      <div className="row mb-3">
        <div className="col-md-3">
          <input type="date" className="form-control"
            onChange={(e) => setFilters({ ...filters, date: e.target.value })} />
        </div>

        <div className="col-md-3">
          <select className="form-control"
            onChange={(e) => setFilters({ ...filters, mode: e.target.value })}>
            <option value="">All Modes</option>
            <option>Cash</option>
            <option>Online</option>
          </select>
        </div>

        <div className="col-md-3">
          <select className="form-control"
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}>
            <option value="">All Status</option>
            <option>Paid</option>
            <option>Pending</option>
          </select>
        </div>

        <div className="col-md-3">
          <input className="form-control"
            placeholder="Search"
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
          />
        </div>
      </div>

      {/* Summary */}
      <div className="row text-center mb-4">
        <div className="col-md-4">
          <div className="p-3 bg-dark rounded">
            <h5>Total Cash</h5>
            ₹{summary.cash}
          </div>
        </div>

        <div className="col-md-4">
          <div className="p-3 bg-dark rounded">
            <h5>Total Online</h5>
            ₹{summary.online}
          </div>
        </div>

        <div className="col-md-4">
          <div className="p-3 bg-dark rounded">
            <h5>Total Pending</h5>
            ₹{summary.pending}
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="text-center mb-4 bg-white p-3 rounded" style={{ maxWidth: 350 }}>
        <Pie data={chartData} />
      </div>

      {/* Table */}
      <div className="table-responsive">
        <table className="table table-bordered text-center table-dark">
          <thead>
            <tr>
              <th>#</th>
              <th>Customer</th>
              <th>Vehicle</th>
              <th>Mobile</th>
              <th>Date</th>
              <th>Total</th>
              <th>Payment</th>
              <th>Details</th>
              <th>❌</th>
            </tr>
          </thead>
          <tbody>
            {filteredData.map((item, i) => (
              <tr key={i}>
                <td>{i + 1}</td>
                <td>{item.customer}</td>
                <td>{item.vehicle}</td>
                <td>{item.mobile}</td>
                <td>{item.date}</td>
                <td>₹{item.total}</td>

                <td>
                  <select
                    value={item.status || "Pending"}
                    onChange={(e) => {
                      const id = item._id || item.id;
                      const newStatus = e.target.value;
                      const prev = [...historyData];
                      const newData = historyData.map((h) =>
                        (h._id || h.id) === id ? { ...h, status: newStatus } : h
                      );
                      setHistoryData(newData);

                      // Persist change
                      const invoice = historyData.find((h) => (h._id || h.id) === id);
                      if (!invoice) return;
                      const payload = { ...invoice, status: newStatus, paymentMode: invoice.paymentMode || (newStatus === 'Paid' ? 'Cash' : invoice.paymentMode) };
                      api.put(`/invoices/${id}`, payload)
                        .then((res) => {
                          // Replace with server response to stay authoritative
                          const updated = prev.map((h) => (h._id || h.id) === id ? res.data : h);
                          setHistoryData(updated);
                        })
                        .catch(() => {
                          setHistoryData(prev);
                          toast.error('Failed to update status');
                        });
                    }}
                  >
                    <option>Pending</option>
                    <option>Paid</option>
                  </select>

                  {item.status === "Paid" && (
                    <select
                      className="mt-2"
                      value={item.paymentMode || "Cash"}
                        onChange={(e) => {
                          const id = item._id || item.id;
                          const newMode = e.target.value;
                          const prev = [...historyData];
                          const newData = historyData.map((h) =>
                            (h._id || h.id) === id ? { ...h, paymentMode: newMode } : h
                          );
                          setHistoryData(newData);

                          const invoice = historyData.find((h) => (h._id || h.id) === id);
                          if (!invoice) return;
                          const payload = { ...invoice, paymentMode: newMode };
                          api.put(`/invoices/${id}`, payload)
                            .then((res) => {
                              const updated = prev.map((h) => (h._id || h.id) === id ? res.data : h);
                              setHistoryData(updated);
                            })
                            .catch(() => {
                              setHistoryData(prev);
                              toast.error('Failed to update payment mode');
                            });
                        }}
                    >
                      <option>Cash</option>
                      <option>Online</option>
                    </select>
                  )}
                </td>

                <td>
                  <button
                    className="btn btn-info btn-sm"
                    onClick={() => {
                      setSelectedInvoice(item);
                      setShowModal(true);
                    }}
                  >
                    View
                  </button>
                </td>

                <td>
                  <button
                    className="btn btn-danger btn-sm"
                    onClick={() => handleDeleteClick(i)}
                  >
                    🗑️
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Undo */}
      {recentlyDeleted && (
        <button className="btn btn-success" onClick={undoDelete}>
          Undo Delete
        </button>
      )}

      {/* Modal */}
      <Modal show={showModal} onHide={() => setShowModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Invoice Details</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedInvoice?.items?.map((item, i) => (
            <div key={i}>
              {item.name} - {item.quantity} x ₹{item.price}
            </div>
          ))}
          <h5 className="mt-3">Total: ₹{selectedInvoice?.total}</h5>
        </Modal.Body>
      </Modal>

      {/* Confirm Delete Modal */}
      <ConfirmModal
        open={showConfirm}
        title="Delete Invoice"
        message="Are you sure you want to delete this invoice? This action cannot be undone."
        onCancel={cancelDelete}
        onConfirm={confirmDelete}
        confirmText="Delete"
        cancelText="Cancel"
      />
    </div>
  );
}

export default History;