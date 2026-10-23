export default function SectionLabel({ id, no, children }) {
  return (
    <h2 id={id} className="section-label">
      <span className="section-label-no">{no}.</span>
      {children}
    </h2>
  )
}
