export default function Loader({ message = "Loading..." }) {
  return (
    <div className="loader-overlay">
      <div className="loader-box">
        <div className="spinner"></div>
        <div className="text-sm text-muted">{message}</div>
      </div>
    </div>
  );
}