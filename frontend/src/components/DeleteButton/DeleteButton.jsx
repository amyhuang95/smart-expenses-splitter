import PropTypes from "prop-types";

export default function DeleteButton({ compact, label, onClick }) {
  return (
    <button
      className={
        compact
          ? "btn btn-sm btn-outline-danger py-0 px-2"
          : "btn btn-sm btn-outline-danger d-flex align-items-center gap-1"
      }
      onClick={onClick}
      aria-label={label}
      title={compact ? "Delete" : undefined}
      type="button"
    >
      <span aria-hidden="true">&#128465;</span>
      {compact ? null : " Delete"}
    </button>
  );
}

DeleteButton.propTypes = {
  compact: PropTypes.bool,
  label: PropTypes.string,
  onClick: PropTypes.func.isRequired,
};
