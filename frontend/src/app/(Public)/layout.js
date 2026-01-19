// app/(public)/layout.js


import 'react-toastify/dist/ReactToastify.css'; // Styles for notifications
import 'leaflet/dist/leaflet.css'; // <-- THE LINE YOU NEED TO ADD for the map
import { ToastContainer } from 'react-toastify';

export default function PublicLayout({ children }) {    
  return (
    <div>
      
      <main>{children}</main>
      <ToastContainer
            position="top-right"
            autoClose={5000}
            hideProgressBar={false}
            theme="light"
          />
    </div>
  );
}