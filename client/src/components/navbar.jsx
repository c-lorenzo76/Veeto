import React from "react";

export function Navbar({ user }){

    const Navigation = ({ children }) => (
        <nav className="flex items-center justify-between p-5">{children}</nav>
    );

    return (
        <Navigation>
            <a href="#" className="flex items-center">
          <span className="self-center whitespace-nowrap text-xl text-gray-700 font-semibold dark:text-gray-600">
            Vote App
          </span>
            </a>
            {!!user && (
                <div className="flex flex-row items-center">
                    <span className="mr-4 text-lg">{user}</span>

                    <img
                        alt="User settings"
                        src={`https://xsgames.co/randomusers/avatar.php?g=female&username=${user}`}
                        className="rounded-full h-10 w-10"
                    />
                </div>
            )}
        </Navigation>
    )
}