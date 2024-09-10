import "../index.css";
import React from "react"
import { Outlet } from "react-router-dom";
import { Navbar } from "../components/navbar.jsx";
import { Copyright } from "lucide-react";

const Footer = () => {
    return (
        <div className="border-t w-full flex justify-center items-center">
            <span className="flex p-2 mt-1 justify-center items-center">
                <Copyright size={12} className="mr-1"/>
                Veeto
            </span>
        </div>
    )
}

export const Layout = ({children, user, avatar}) => {
    return (
        <div className="p-8">
            <Navbar children={children} user={user} avatar={avatar}/>
            <div className="grid place-items-center">{children}</div>
            <Footer/>
            <Outlet/>
        </div>
    );
};