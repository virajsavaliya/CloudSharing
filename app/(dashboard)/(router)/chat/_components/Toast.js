export default function Toast({ toast }) {
  if (!toast) return null;
  return (
    <div className="fixed top-6 left-1/2 transform -translate-x-1/2 bg-red-500 text-white px-6 py-2 rounded shadow-lg z-50 animate-fadeIn" role="alert">
      {toast}
    </div>
  );
}
