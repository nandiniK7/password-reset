import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import axios from "axios";
import { API_URL } from "../api";
import AuthCard from "../components/AuthCard";

function ForgotPassword() {
  const location = useLocation();
  const [email, setEmail] = useState(location.state?.email || "");
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const [resetLink, setResetLink] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSuccess("");
    setError("");
    setResetLink("");
    setLoading(true);

    try {
      const response = await axios.post(`${API_URL}/api/auth/forgot-password`, {
        email: email.trim(),
      });
      setSuccess(response.data?.message || "Password reset link sent to your email.");
      setResetLink(response.data?.resetLink || "");
    } catch (err) {
      setError(err.response?.data?.message || "Unable to process the request. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthCard
      icon="bi-key"
      title="Forgot Password"
      subtitle="Enter your registered email and we'll send you a reset link."
    >
      {location.state?.registered && (
        <div className="alert alert-success py-2" role="status">
          <i className="bi bi-check-circle me-2" aria-hidden="true" />
          Registration successful. Now request a password reset link.
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="mb-3">
          <label htmlFor="email" className="form-label">Email</label>
          <div className="input-group">
            <span className="input-group-text"><i className="bi bi-envelope" aria-hidden="true" /></span>
            <input
              id="email"
              type="email"
              className="form-control"
              placeholder="Enter your email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              autoComplete="email"
              required
            />
          </div>
        </div>

        {error && (
          <div className="alert alert-danger py-2" role="alert">
            <i className="bi bi-exclamation-circle me-2" aria-hidden="true" />
            {error}
          </div>
        )}

        {success && (
          <div className="alert alert-success py-2" role="status">
            <i className="bi bi-check-circle me-2" aria-hidden="true" />
            {success}
          </div>
        )}

        {resetLink && (
          <div className="alert alert-info py-2 small" role="status">
            <strong className="d-block mb-1">Test reset link</strong>
            <a href={resetLink} className="reset-link">{resetLink}</a>
          </div>
        )}

        <button type="submit" className="btn btn-primary w-100" disabled={loading}>
          {loading ? (
            <>
              <span className="spinner-border spinner-border-sm me-2" aria-hidden="true" />
              Sending...
            </>
          ) : (
            <>
              <i className="bi bi-send me-2" aria-hidden="true" />
              Send Reset Link
            </>
          )}
        </button>
      </form>

      <p className="text-center small mt-4 mb-0">
        <Link to="/">
          <i className="bi bi-arrow-left me-1" aria-hidden="true" />
          Back to Register
        </Link>
      </p>
    </AuthCard>
  );
}

export default ForgotPassword;
