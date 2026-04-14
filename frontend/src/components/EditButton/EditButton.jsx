import PropTypes from "prop-types";

export default function EditButton({ compact, label, onClick }) {
  return (
    <button
      className={
        compact
          ? "btn btn-sm btn-outline-secondary py-0 px-2"
          : "btn btn-sm btn-outline-secondary d-flex align-items-center gap-1"
      }
      onClick={onClick}
      aria-label={label}
      title={compact ? "Edit" : undefined}
      type="button"
    >
      <span aria-hidden="true">&#9998;</span>
      {compact ? null : " Edit"}
    </button>
  );
}

EditButton.propTypes = {
  compact: PropTypes.bool,
  label: PropTypes.string,
  onClick: PropTypes.func.isRequired,
};
