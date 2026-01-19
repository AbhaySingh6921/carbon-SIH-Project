"use client";


import "./globals.css";
import { Web3Provider } from "../../context/Web3Context";
import { Navbar } from "../../components/Navbar";



export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        {/* Wrap Navbar + page content inside the same AuthProvider */}
        <Web3Provider>
          
          <Navbar />
         
          <main>{children}</main>
        </Web3Provider>
      </body>
    </html>
  );
}
