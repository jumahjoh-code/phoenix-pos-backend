export default function Card({ children, variant = "default" }) {
  return (
    <div className={`card card-${variant}`}>
      {children}
    </div>
  );
}