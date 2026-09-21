function AuthCard({ icon, title, subtitle, children }) {
  return (
    <div className="auth-page d-flex align-items-center justify-content-center px-3 py-4">
      <div className="card shadow-sm auth-card w-100">
        <div className="card-body p-4 p-md-5">
          {icon && (
            <div className="auth-icon mb-3" aria-hidden="true">
              <i className={`bi ${icon}`} />
            </div>
          )}
          <h1 className="h3 mb-1">{title}</h1>
          {subtitle && <p className="text-secondary mb-4">{subtitle}</p>}
          {children}
        </div>
      </div>
    </div>
  );
}

export default AuthCard;
