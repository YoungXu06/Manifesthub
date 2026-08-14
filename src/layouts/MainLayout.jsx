import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import Navbar from '../components/navigation/Navbar';
import Sidebar from '../components/navigation/Sidebar';
import Footer from '../components/navigation/Footer';
import InterruptInbox from '../components/interrupts/InterruptInbox';
import useStore from '../store';

const MainLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const { darkMode } = useStore();
  const navigate = useNavigate();

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
  }, [darkMode]);

  // Open the interrupt flow from anywhere via CustomEvent
  useEffect(() => {
    const handleOpenInterrupt = (event) => {
      const slot = event.detail?.slot;
      navigate(slot ? `/interrupt?slot=${slot}` : '/interrupt');
    };
    window.addEventListener('mh:open-interrupt', handleOpenInterrupt);
    return () => window.removeEventListener('mh:open-interrupt', handleOpenInterrupt);
  }, [navigate]);

  // Handle responsive sidebar behavior
  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth >= 768) {
        setSidebarOpen(true);
      } else {
        setSidebarOpen(false);
      }
    };

    // Set initial state
    checkScreenSize();

    // Add event listener
    window.addEventListener('resize', checkScreenSize);

    // Clean up
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-dark">
      {/* Sidebar */}
      <Sidebar open={sidebarOpen} setOpen={setSidebarOpen} isMobile={isMobile} />
      
      {/* Main Content */}
      <div className={`flex-1 flex flex-col overflow-hidden ${
        sidebarOpen && !isMobile ? 'md:ml-64' : ''
      } transition-all duration-300`}>
        {/* Top Navigation */}
        <Navbar 
          toggleSidebar={toggleSidebar} 
          sidebarOpen={sidebarOpen} 
          isMobile={isMobile}
        />
        
        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 bg-gray-50 dark:bg-dark">
          <div className="container mx-auto">
            <InterruptInbox />
            <Outlet />
          </div>
        </main>
        
        {/* Footer */}
        <Footer />
      </div>
    </div>
  );
};

export default MainLayout;
