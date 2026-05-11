import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";

export default function MainLayout({ children }) {
  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      
      {/* Sidebar */}
      <Sidebar />

      {/* Main content area */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        
        {/* Top Navbar */}
        <Navbar />

        {/* Page Content */}
        <main style={{ padding: "20px", flex: 1 }}>
          {children}
        </main>
      </div>
    </div>
  );
}