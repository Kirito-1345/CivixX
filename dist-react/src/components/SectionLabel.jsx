export default function SectionLabel({ no, children }) {
  return (
    <h2 className="section-label">
      <span className="section-label-no">{no}.</span>
      {children}
    </h2>
  )
}
