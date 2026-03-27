import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";


function Navbar() {
  const navigate = useNavigate();
  const [logged, setLogged] = useState(() => {
    try {
      return !!localStorage.getItem('isLoggedIn');
    } catch {
      return false;
    }
  });
  const [collapsed, setCollapsed] = useState(true);

  const handleToggle = () => setCollapsed((prev) => !prev);

  const logout = () => {
    const ok = window.confirm('Are you sure you want to log out?');
    if (!ok) return;
    setLogged(false);
    try { localStorage.removeItem('user'); } catch (err) { console.warn('logout: clear user failed', err); }
    try { localStorage.removeItem('token'); } catch (err) { console.warn('logout: clear token failed', err); }
    try { localStorage.removeItem('isLoggedIn'); } catch (err) { console.warn('logout: clear flag failed', err); }
    navigate('/login');
  };

  return (
    <nav className="navbar navbar-expand-lg navbar-dark bg-dark sticky-top shadow">
      <div className="container-fluid">
        <Link className="navbar-brand d-flex align-items-center fw-bold" to="/">
          <img src={encodeURI('/logo krishna1.JPG')} alt="logo" style={{ height: 32, width: 32, objectFit: 'cover', marginRight: 8, borderRadius:4 }} />
          Krishna Automobiles
        </Link>

        <button
          className="navbar-toggler"
          type="button"
          aria-controls="navbarNav"
          aria-expanded={!collapsed}
          aria-label="Toggle navigation"
          onClick={handleToggle}
        >
          <span className="navbar-toggler-icon"></span>
        </button>

        <div className={`navbar-collapse collapse${!collapsed ? ' show' : ''}`} id="navbarNav">
          <ul className="navbar-nav ms-auto">
            <li className="nav-item"><Link className="nav-link" to="/">🏠 Home</Link></li>
            <li className="nav-item"><Link className="nav-link" to="/inventory">📦 Inventory</Link></li>
            <li className="nav-item"><Link className="nav-link" to="/invoice">🧾 Invoice</Link></li>
            <li className="nav-item"><Link className="nav-link" to="/history">📜 History</Link></li>

            {logged ? (
              <li className="nav-item">
                <button className="nav-link text-danger border-0 bg-transparent" onClick={logout}>🚪 Logout</button>
              </li>
            ) : (
              <>
                <li className="nav-item"><Link className="nav-link" to="/login">🔐 Login</Link></li>
                <li className="nav-item"><Link className="nav-link" to="/register">✍️ Register</Link></li>
              </>
            )}

          </ul>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;