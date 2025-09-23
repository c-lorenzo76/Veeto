import "../index.css";
import React from "react"
import { Outlet } from "react-router-dom";
import { Navbar } from "../components/navbar.jsx";
import { Footer } from "../components/Footer.jsx";

export const Layout = ({children, user, avatar}) => {
    return (
        <div className="p-6">
            <Navbar children={children} user={user} avatar={avatar}/>
            <div className="grid place-items-center">{children}</div>
            <Footer/>
            <Outlet/>
        </div>
    );
};