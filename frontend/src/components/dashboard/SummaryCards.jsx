import { summaryCards as fallbackCards } from '../../data/dashboardData'
import './dashboard.css'

export function SummaryCards({ cards = fallbackCards }) {
  return (
    <section className="summary-grid">
      {cards.map((card) => (
        <article className="summary-card" key={card.label}>
          <span>{card.label}</span>
          <strong>{card.value}</strong>
          <small>{card.detail}</small>
        </article>
      ))}
    </section>
  )
}