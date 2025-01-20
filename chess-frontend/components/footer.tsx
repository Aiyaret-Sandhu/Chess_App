const Footer = () => {
    return (
      <footer className="w-[100vw] py-2 px-10 flex justify-between align-middle border-none gap-6" 
              style={{ 
                boxShadow: '-1px -1px 4px rgba(40,40,40,0.6)', 
                opacity: '0.8', 
                backgroundColor: 'rgba(20,20,20,0.8)',
                position: 'absolute',
                bottom: '0',
              }}>
        <p>&copy; 2024 MyChess</p>
        <p>Made by : Arsh aka Aiyaret</p>
      </footer>
    );
  };
  
  export default Footer;
  