import Button from '../atoms/Button';

const Topbar = ({ onLogout }: { onLogout: () => void }) => (
  <header className="flex items-center justify-between px-8 py-4 bg-white shadow w-full">
    <div>
      <input
        type="text"
        placeholder="Search"
        className="border rounded px-3 py-1 text-gray-700"
        style={{ width: 200 }}
      />
    </div>
    <div className="flex items-center gap-6">
      <div className="relative">
        <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full px-1">8</span>
        <span className="text-2xl">🔔</span>
      </div>
      <img src="/profile.png" alt="User" className="h-10 w-10 rounded-full border-2 border-gray-300" />
      <Button onClick={onLogout}>Logout</Button>
    </div>
  </header>
);

export default Topbar;