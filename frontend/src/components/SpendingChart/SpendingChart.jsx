import PropTypes from "prop-types";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

const COLORS = {
  food: "#ff6b6b",
  transport: "#4ecdc4",
  utilities: "#ffd93d",
  entertainment: "#a855f7",
  other: "#6b7280",
};

export default function SpendingChart({ categoryBreakdown }) {
  const data = Object.entries(categoryBreakdown).map(([name, value]) => ({
    name: name.charAt(0).toUpperCase() + name.slice(1),
    value: Math.round(value * 100) / 100,
    color: COLORS[name] || "#6b7280",
  }));

  if (data.length === 0) return null;

  return (
    <div className="card">
      <div className="card-body">
        <h6 className="fw-bold">Spending by Category</h6>
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
                <Cell key={i} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip formatter={(val) => `$${val.toFixed(2)}`} />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

SpendingChart.propTypes = {
  categoryBreakdown: PropTypes.objectOf(PropTypes.number).isRequired,
};
