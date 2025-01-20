
import React from 'react';
import './../globals.css'; 
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Footer from '@/components/footer'
import Header from '@/components/header';

const GameEngineLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div>
      
      <Header text="Local game with friend.."/>
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
