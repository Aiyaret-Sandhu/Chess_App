// app/gamewengine/layout.tsx
import React from 'react';
import './../globals.css'; // Optional: import global styles
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Footer from '@/components/footer'

const GameEngineLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div>
      
      <main className='py-4'>{children}</main>
      <Footer />
      <ToastContainer
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="colored"
      />
    </div>
  );
};

export default GameEngineLayout;
