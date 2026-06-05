import { Outlet } from "react-router-dom";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";

export default function CommonLayout() {
  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-slate-950 overflow-x-hidden font-sans text-gray-900 dark:text-slate-100 transition-colors duration-300">
      <Navbar />
      
      {/* 
        Removed the strict max-width constraints and padding here. 
        Each page (Home, About, Contact) will now handle its own container widths 
        so that background colors can stretch full-width seamlessly!
      */}
      <main className="flex-1 w-full flex flex-col">
        <Outlet />
      </main>
      
      <Footer />
    </div>
  );
}