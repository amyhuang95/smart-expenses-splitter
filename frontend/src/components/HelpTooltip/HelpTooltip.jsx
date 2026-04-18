import { useState, useRef, useEffect } from "react";
import PropTypes from "prop-types";
import "./HelpTooltip.css";

export default function HelpTooltip({ content, position }) {
  const [open, setOpen] = useState(false);
  const tooltipRef = useRef(null);

  // Close on Escape or click outside
  useEffect(() => {
    if (!open) return;
    const handleKey = (e) => {
      if (e.key === "Escape") setOpen(false);
    };
    const handleClick = (e) => {
      if (tooltipRef.current && !tooltipRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("keydown", handleKey);
    document.addEventListener("mousedown", handleClick);
    return () => {
      document.removeEventListener("keydown", handleKey);
      document.removeEventListener("mousedown", handleClick);
    };
  }, [open]);

  return (
    <span className="help-tooltip" ref={tooltipRef}>
      <button
        className="help-tooltip__trigger"
        onClick={() => setOpen(!open)}
        aria-label="Help"
        aria-expanded={open}
        type="button"
      >
        ?
      </button>
      {open && (
        <div
          className={`help-tooltip__content help-tooltip__content--${position || "bottom"}`}
          role="tooltip"
        >
          {content}
        </div>
      )}
    </span>
  );
}

HelpTooltip.propTypes = {
  content: PropTypes.node.isRequired,
  position: PropTypes.oneOf(["top", "bottom", "left", "right"]),
};

HelpTooltip.defaultProps = {
  position: "bottom",
};
