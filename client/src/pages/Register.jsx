import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import { API_URL } from "../api";
import AuthCard from "../components/AuthCard";

const MIN_PASSWORD_LENGTH = 6;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function Register() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [emailTaken, setEmailTaken] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleChange = (event) => {
    setFormData((current) => ({
      ...current,
      [event.target.name]: event.target.value,
    }));
  };

  const validate = () => {
    if (!formData.name.trim()) return "Name is required.";
    if (!EMAIL_PATTERN.test(formData.email.trim())) return "Please enter a valid email address.";
    if (formData.password.length < MIN_PASSWORD_LENGTH) {
      return `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`;
    }
    return "";
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setEmailTaken(false);

    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setError("");
    setLoading(true);

    try {
      await axios.post(`${API_URL}/api/auth/register`, {
        name: formData.name.trim(),
        email: formData.email.trim(),
        password: formData.password,
      });

      // Registration goes straight to Forgot Password. There is no login step.
      navigate("/forgot-password", {
        state: { email: formData.email.trim(), registered: true },
      });
    } catch (err) {
      setEmailTaken(err.response?.status === 409);
      setError(err.response?.data?.message || "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthCard
      icon="bi-person-plus"
      title="Register"
      subtitle="Create an account to try the password reset flow."
    >
      <form onSubmit={handleSubmit} noValidate>
        <div className="mb-3">
          <label htmlFor="name" className="form-label">Name</label>
          <div className="input-group">
            <span className="input-group-text"><i className="bi bi-person" aria-hidden="true" /></span>
            <input
              id="name"
              type="text"
              name="name"
              className="form-control"
              placeholder="Enter your name"
              value={formData.name}
              onChange={handleChange}
              autoComplete="name"
              required
            />
          </div>
        </div>

        <div className="mb-3">
          <label htmlFor="email" className="form-label">Email</label>
          <div className="input-group">
            <span className="input-group-text"><i className="bi bi-envelope" aria-hidden="true" /></span>
            <input
              id="email"
              type="email"
              name="email"
              className="form-control"
              placeholder="Enter your email"
              value={formData.email}
              onChange={handleChange}
              autoComplete="email"
              required
            />
          </div>
        </div>

        <div className="mb-3">
          <label htmlFor="password" className="form-label">Password</label>
          <div className="input-group">
            <span className="input-group-text"><i className="bi bi-lock" aria-hidden="true" /></span>
            <input
              id="password"
              type="password"
              name="password"
              className="form-control"
              placeholder={`Minimum ${MIN_PASSWORD_LENGTH} characters`}
              value={formData.password}
              onChange={handleChange}
              autoComplete="new-password"
              required
            />
          </div>
        </div>

        {error && (
          <div className="alert alert-danger py-2" role="alert">
            <i className="bi bi-exclamation-circle me-2" aria-hidden="true" />
            {error}
            {emailTaken && (
              <div className="mt-1">
                <Link to="/forgot-password" state={{ email: formData.email.trim() }}>
                  Forgot your password? Reset it
                </Link>
              </div>
            )}
          </div>
        )}

        <button type="submit" className="btn btn-primary w-100" disabled={loading}>
          {loading ? (
            <>
              <span className="spinner-border spinner-border-sm me-2" aria-hidden="true" />
              Registering...
            </>
          ) : (
            <>
              <i className="bi bi-person-plus me-2" aria-hidden="true" />
              Register
            </>
          )}
        </button>
      </form>

      <p className="text-center text-secondary small mt-4 mb-0">
        Forgot your password? <Link to="/forgot-password">Reset it here</Link>
      </p>
    </AuthCard>
  );
}

export default Register;
