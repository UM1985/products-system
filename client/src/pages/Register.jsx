import { useForm } from "react-hook-form";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";

function Register() {
  const { register, handleSubmit, formState: { errors } } = useForm();
  const navigate = useNavigate();

  const { login } = useAuth();

  const onSubmit = (data) => {
    api.post("/auth/register", data)
      .then((res) => {
        const { token, user } = res.data;
        login({ token, user });
        toast.success("Registration Successful!");
        navigate("/");
      })
      .catch((err) => {
        const msg = err?.response?.data?.message || "Registration failed";
        toast.error(msg);
      });
  };

  return (
    <div className="d-flex justify-content-center align-items-center vh-100 bg-light">
      <div className="card shadow p-4" style={{ width: "400px" }}>
        <h3 className="text-center mb-4">Create Account</h3>

        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="mb-3">
            <label>Name</label>
            <input className="form-control" {...register("name", { required: "Name required" })} />
            {errors.name && <small className="text-danger">{errors.name.message}</small>}
          </div>

          <div className="mb-3">
            <label>Email</label>
            <input type="email" className="form-control" {...register("email", { required: "Email required" })} />
            {errors.email && <small className="text-danger">{errors.email.message}</small>}
          </div>

          <div className="mb-3">
            <label>Password</label>
            <input type="password" className="form-control" {...register("password", { required: "Password required" })} />
            {errors.password && <small className="text-danger">{errors.password.message}</small>}
          </div>

          <button className="btn btn-dark w-100">Register</button>
        </form>
      </div>
    </div>
  );
}

export default Register;
