import { useEffect, useState } from "react";
import axios from "axios";
import { Link, useParams } from "react-router-dom";
import { API_URL } from "../api";
import AuthCard from "../components/AuthCard";

const MIN_PASSWORD_LENGTH = 6;
const INVALID_LINK_MESSAGE = "Invalid or expired reset link.";

function ResetPassword() {
  const { token } = useParams();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [checkingToken, setCheckingToken] = useState(true);
  const [tokenValid, setTokenValid] = useState(false);
  const [tokenError, setTokenError] = useState("");

  // Verify the token before showing the form.
  useEffect(() => {
    let cancelled = false;

    const verifyToken = async () => {
      try {
        await axios.get(`${API_URL}/api/auth/verify-reset-token/${encodeURIComponent(token)}`);
        if (!cancelled) setTokenValid(true);
      } catch (err) {
        if (cancelled) return;

        // 4xx from the API means the link is bad; anything else is a connectivity problem.
        const message = err.response
          ? err.response.data?.message || INVALID_LINK_MESSAGE
          : "Unable to reach the server. Please try again.";

        setTokenValid(false);
        setTokenError(message);
        window.alert(message);
      } finally {
        if (!cancelled) setCheckingToken(false);
      }
    };

    verifyToken();

    return () => {
      cancelled = true;
    };
  }, [token]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    if (password.length < MIN_PASSWORD_LENGTH) {
      setError(`Password must be at least ${MIN_PASSWORD_LENGTH} characters.`);
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      await axios.post(`${API_URL}/api/auth/reset-password/${encodeURIComponent(token)}`, { password });
      setSuccess(true);
    } catch (err) {
      const message = err.response
        ? err.response.data?.message || "Unable to reset password."
        : "Unable to reach the server. Please try again.";

      // The link was consumed or expired while the form was open.
      if (err.response?.status === 400 && message === INVALID_LINK_MESSAGE) {
        setTokenValid(false);
        setTokenError(message);
        window.alert(message);
      } else {
        setError(message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthCard
      icon="bi-shield-lock"
      title="Reset Password"
      subtitle={!success && tokenValid ? "Choose a new password for your account." : undefined}
    >
      {checkingToken && (
        <div className="d-flex align-items-center text-secondary" role="status">
          <span className="spinner-border spinner-border-sm me-2" aria-hidden="true" />
          Verifying your reset link...
        </div>
      )}

      {!checkingToken && !tokenValid && !success && (
        <div className="alert alert-danger mb-0" role="alert">
          <i className="bi bi-exclamation-triangle me-2" aria-hidden="true" />
          {tokenError || INVALID_LINK_MESSAGE}
        </div>
      )}

      {success && (
        <div className="alert alert-success mb-0" role="status">
          <i className="bi bi-check-circle me-2" aria-hidden="true" />
          Password reset successfully.
        </div>
      )}

      {!checkingToken && tokenValid && !success && (
        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label htmlFor="password" className="form-label">New Password</label>
            <div className="input-group">
              <span className="input-group-text"><i className="bi bi-lock" aria-hidden="true" /></span>
              <input
                id="password"
                type="password"
                className="form-control"
                placeholder={`Minimum ${MIN_PASSWORD_LENGTH} characters`}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                autoComplete="new-password"
                required
              />
            </div>
          </div>

          <div className="mb-3">
            <label htmlFor="confirmPassword" className="form-label">Confirm Password</label>
            <div className="input-group">
              <span className="input-group-text"><i className="bi bi-lock-fill" aria-hidden="true" /></span>
              <input
                id="confirmPassword"
                type="password"
                className="form-control"
                placeholder="Re-enter your new password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                autoComplete="new-password"
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

          <button type="submit" className="btn btn-primary w-100" disabled={loading}>
            {loading ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" aria-hidden="true" />
                Resetting...
              </>
            ) : (
              <>
                <i className="bi bi-check2-circle me-2" aria-hidden="true" />
                Reset Password
              </>
            )}
          </button>
        </form>
      )}

      {!checkingToken && !tokenValid && !success && (
        <p className="text-center small mt-4 mb-0">
          <Link to="/forgot-password">Request a new reset link</Link>
        </p>
      )}
    </AuthCard>
  );
}

export default ResetPassword;
