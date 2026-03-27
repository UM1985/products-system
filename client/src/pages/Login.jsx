import { useForm } from "react-hook-form";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";

function Login() {
  const { register, handleSubmit, formState: { errors } } = useForm();
  const navigate = useNavigate();

  const { login } = useAuth();

  const onSubmit = (data) => {
    api.post("/auth/login", data)
      .then((res) => {
        const { token, user } = res.data;
        login({ token, user });
        toast.success("Login Successful!");
        navigate("/");
      })
      .catch((err) => {
        const msg = err?.response?.data?.message || "Invalid Credentials";
        toast.error(msg);
      });
  };

  return (
    <div className="d-flex justify-content-center align-items-center vh-100 bg-light">
      
      <div className="card shadow p-4" style={{ width: "400px" }}>
        
        <h3 className="text-center mb-4">Garage Login</h3>

        <form onSubmit={handleSubmit(onSubmit)}>
          
          {/* Email */}
          <div className="mb-3">
            <label>Email</label>
            <input
              type="email"
              className="form-control"
              placeholder="Enter email"
              {...register("email", { required: "Email is required" })}
            />
            {errors.email && <small className="text-danger">{errors.email.message}</small>}
          </div>

          {/* Password */}
          <div className="mb-3">
            <label>Password</label>
            <input
              type="password"
              className="form-control"
              placeholder="Enter password"
              {...register("password", { required: "Password is required" })}
            />
            {errors.password && <small className="text-danger">{errors.password.message}</small>}
          </div>

          {/* Button */}
          <button className="btn btn-dark w-100">Login</button>

        </form>

      </div>

    </div>
  );
}

export default Login;