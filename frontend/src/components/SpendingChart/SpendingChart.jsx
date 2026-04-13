import PropTypes from "prop-types";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts";
import HelpTooltip from "../HelpTooltip/HelpTooltip.jsx";
import "./SpendingChart.css";

const COLORS = {
  food: "#dc3545",
  transport: "#0dcaf0",
  utilities: "#ffc107",
  entertainment: "#7c3aed",
  other: "#6c757d",
};

export default function SpendingChart({ categoryBreakdown }) {
  const data = Object.entries(categoryBreakdown).map(([name, value]) => ({
    name: name.charAt(0).toUpperCase() + name.slice(1),
    value: Math.round(value * 100) / 100,
    color: COLORS[name] || "#6c757d",
  }));

  if (data.length === 0) return null;

  return (
    <section className="card" aria-label="Spending breakdown by category">
      <div className="card-body">
        <h3 className="spending-chart__title">
          Spending by Category{" "}
          <HelpTooltip
            content="Hover over each slice to see the dollar amount. The chart shows all your expenses, not just filtered ones."
          />
        </h3>
        <ResponsiveContainer width="100%" height={220}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={45}
              outerRadius={70}
              paddingAngle={3}
              dataKey="value"
            >
              {data.map((entry, i) => (
                <Cell key={`cell-${i}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip formatter={(val) => `$${val.toFixed(2)}`} />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}

SpendingChart.propTypes = {
  categoryBreakdown: PropTypes.objectOf(PropTypes.number).isRequired,
};
