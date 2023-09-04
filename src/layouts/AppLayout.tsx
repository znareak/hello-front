import { Suspense, useState, useContext } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "components/Sidebar";
import Appbar from "components/Appbar";
import { SearchContext } from "../contexts/SearchContext";

export default function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  return (
    <SearchContext.Provider value={{ searchTerm, setSearchTerm }}>
      <div className="flex h-screen flex-col justify-between">
        <div className="flex flex-grow">
          <div
            className={`px-6 py-4 ${sidebarOpen ? "block" : "hidden"} md:block`}
          >
            <Sidebar setSidebarOpen={setSidebarOpen} />
          </div>
          <div
            className={`flex flex-col flex-1 md:px-10 px-5 py-4 ${
              sidebarOpen ? "hidden" : "block"
            }`}
          >
            <Appbar onSearchChange={(e) => setSearchTerm(e.target.value)} />
            <Suspense fallback={<></>}>
              <Outlet />
            </Suspense>
          </div>
        </div>
        {!sidebarOpen && (
          <button
            className="py-6 border-t w-full md:hidden fixed top-0 right-0 bg-white z-50 bg-white"
            onClick={() => setSidebarOpen(true)}
          >
            Open Sidebar
          </button>
        )}
      </div>
    </SearchContext.Provider>
  );
}
