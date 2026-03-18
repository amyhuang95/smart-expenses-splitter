import PropTypes from "prop-types";

export default function BalanceSummary({ balances }) {
  if (!balances) {
    return (
      <div className="card">
        <div className="card-body text-secondary small">Loading balances...</div>
      </div>
    );
  }

  const { summary, details } = balances;

  return (
    <div className="card">
      <div className="card-body">
        <h6 className="fw-bold mb-3">My Balance</h6>

        {/* Net summary */}
        <div className="d-flex justify-content-between mb-3 pb-2 border-bottom">
          <div className="text-center">
            <small className="text-secondary d-block">You Owe</small>
            <span className="fw-bold text-danger">${summary.youOwe.toFixed(2)}</span>
          </div>
          <div className="text-center">
            <small className="text-secondary d-block">Owed to You</small>
            <span className="fw-bold text-success">${summary.owedToYou.toFixed(2)}</span>
          </div>
          <div className="text-center">
            <small className="text-secondary d-block">Net</small>
            <span className={`fw-bold ${summary.net >= 0 ? "text-success" : "text-danger"}`}>
              {summary.net >= 0 ? "+" : ""}${summary.net.toFixed(2)}
            </span>
          </div>
        </div>

        {/* Per-person breakdown */}
        {details.length === 0 ? (
          <div className="text-center py-2">
            <span className="badge bg-success fs-6 mb-1">✓</span>
            <p className="text-success fw-bold mb-0 small">All settled up!</p>
          </div>
        ) : (
          <div className="d-flex flex-column gap-2">
            {details.map((d) => (
              <div
                key={d.person}
                className="d-flex align-items-center justify-content-between bg-light rounded p-2"
              >
                <span className="small">
                  {d.direction === "owes_you" ? (
                    <>
                      <span className="fw-bold">{d.person}</span>
                      <span className="text-secondary"> owes you</span>
                    </>
                  ) : (
                    <>
                      <span className="text-secondary">You owe </span>
                      <span className="fw-bold">{d.person}</span>
                    </>
                  )}
                </span>
                <span
                  className={`fw-bold small ${d.direction === "owes_you" ? "text-success" : "text-danger"}`}
                >
                  {d.direction === "owes_you" ? "+" : "-"}${d.amount.toFixed(2)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

BalanceSummary.propTypes = {
  balances: PropTypes.shape({
    summary: PropTypes.shape({
      youOwe: PropTypes.number.isRequired,
      owedToYou: PropTypes.number.isRequired,
      net: PropTypes.number.isRequired,
    }).isRequired,
    details: PropTypes.arrayOf(
      PropTypes.shape({
        person: PropTypes.string.isRequired,
        amount: PropTypes.number.isRequired,
        direction: PropTypes.string.isRequired,
      }),
    ).isRequired,
  }),
};

BalanceSummary.defaultProps = {
  balances: null,
};
