import { useUser } from "../../context/useUser.js";
import "./HomePage.css";

export default function HomePage() {
  const { user } = useUser();

  return (
    <section className="home-page">
      <div className="home-page__hero">
        <h1 className="home-page__title">
          Welcome back{user?.name ? `, ${user.name}` : ""}.
        </h1>
        <p className="home-page__copy">
          Start logging shared expenses and settling balances...
        </p>
      </div>
      <section className="home-page__feature-section" aria-label="Feature overview">
        <div className="home-page__feature-block">
          <h2 className="home-page__feature-title">Group Expenses</h2>
          <ul className="home-page__feature-list">
            <li>Create groups for trips, roommates, or events.</li>
            <li>Add members and split shared expenses clearly.</li>
            <li>Track balances and settle debts in one place.</li>
          </ul>
        </div>
        <div className="home-page__feature-block">
          <h2 className="home-page__feature-title">Single Expenses</h2>
          <ul className="home-page__feature-list">
            <li>Log a one-off expense and split it with anyone.</li>
            <li>Track who has paid and who still owes.</li>
            <li>View your personal balance and spending breakdown.</li>
          </ul>
        </div>
      </section>
    </section>
  );
}
