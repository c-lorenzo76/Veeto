import "../index.css";
import React from "react"
import { Outlet } from "react-router-dom";
import { Navbar } from "../components/navbar.jsx";


export const Layout = ({ children, user }) => {
    return (
        <div className="p-8">
            <Navbar children={children} user={user} />
            <div className="grid place-items-center mt-8">{children}</div>
            <Outlet />
        </div>
    );
};