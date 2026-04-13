import PropTypes from "prop-types";
import HelpTooltip from "../HelpTooltip/HelpTooltip.jsx";
import "./PersonalBalanceSummary.css";

export default function PersonalBalanceSummary({ balances = null }) {
  if (!balances) {
    return (
      <section className="card" aria-label="Balance summary" aria-busy="true">
        <div className="card-body text-secondary small">Loading balances...</div>
      </section>
    );
  }

  const { summary, details } = balances;

  return (
    <section className="card" aria-label="Personal balance summary">
      <div className="card-body">
        <h3 className="h6 fw-bold mb-1">
          My Balance{" "}
          <HelpTooltip
            content="Your net balance across all unsettled expenses. Green = someone owes you. Red = you owe someone. When everyone marks paid, the expense auto-settles."
          />
        </h3>
        <p className="balance-summary__legend">
          <span className="text-success">Green</span> = owed to you &middot;{" "}
          <span className="text-danger">Red</span> = you owe
        </p>

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

        {/* Per-person */}
        {details.length === 0 ? (
          <div className="text-center py-2" role="status">
            <span className="badge bg-success fs-6 mb-1" aria-hidden="true">&#10003;</span>
            <p className="text-success fw-bold mb-0 small">All settled up!</p>
          </div>
        ) : (
          <ul className="list-unstyled d-flex flex-column gap-2" aria-label="Balance per person">
            {details.map((d) => (
              <li key={d.person} className="d-flex align-items-center justify-content-between bg-light rounded p-2">
                <span className="small">
                  {d.direction === "owes_you" ? (
                    <><span className="fw-bold">{d.person}</span><span className="text-secondary"> owes you</span></>
                  ) : (
                    <><span className="text-secondary">You owe </span><span className="fw-bold">{d.person}</span></>
                  )}
                </span>
                <span className={`fw-bold small ${d.direction === "owes_you" ? "text-success" : "text-danger"}`}>
                  {d.direction === "owes_you" ? "+" : "-"}${d.amount.toFixed(2)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}

PersonalBalanceSummary.propTypes = {
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