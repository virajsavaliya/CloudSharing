import { Plus, Send, X } from "lucide-react";

export default function AddIdModal({ showAddId, setShowAddId, otherId, setOtherId, handleConnectById, idError }) {
  if (!showAddId) return null;
  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center transition-all" aria-modal="true" role="dialog">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-xs mx-2 animate-fadeIn">
        <h2 className="font-bold text-xl mb-4 text-blue-700 text-center flex items-center gap-2">
          <Plus className="w-6 h-6" /> Start New Chat
        </h2>
        <input
          className="w-full border border-gray-200 rounded-full px-4 py-2 mb-3 font-mono focus:outline-none focus:ring-2 focus:ring-blue-200 transition"
          placeholder="Enter other user's Chat ID"
          value={otherId}
          onChange={(e) => setOtherId(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleConnectById()}
          autoFocus
          aria-label="Enter other user's Chat ID"
        />
        {idError && <div className="text-xs text-red-500 mb-2">{idError}</div>}
        <div className="flex gap-2 mt-2">
          <button
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-full shadow flex items-center justify-center gap-1"
            onClick={handleConnectById}
            aria-label="Connect"
            title="Connect"
          >
            <Send className="w-5 h-5" /> Connect
          </button>
          <button
            className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 py-2 rounded-full shadow flex items-center justify-center gap-1"
            onClick={() => {
              setShowAddId(false);
              setOtherId("");
              setIdError("");
            }}
            aria-label="Cancel"
            title="Cancel"
          >
            <X className="w-5 h-5" /> Cancel
          </button>
        </div>
      </div>
    </div>
  );
}