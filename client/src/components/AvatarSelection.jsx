// AvatarSelection.jsx
import React from 'react';
import alien from '../assets/avatar-pfp/Alien.svg';
import batman from '../assets/avatar-pfp/Batman.svg';
import chickenLeg from '../assets/avatar-pfp/ChickenLeg.svg';
import deadPool from '../assets/avatar-pfp/DeadPool.svg';
import hotdog from '../assets/avatar-pfp/hotdog.svg';
import ironMan from '../assets/avatar-pfp/IronMan.svg';
import sailorCat from '../assets/avatar-pfp/Sailor-Cat.svg';
import wolverine from "../assets/avatar-pfp/Wolverine.svg";

const avatars = {
    Alien: alien,
    Batman: batman,
    ChickenLeg: chickenLeg,
    DeadPool: deadPool,
    hotdog: hotdog,
    IronMan: ironMan,
    SailorCat: sailorCat,
    Wolverine: wolverine,
};

const AvatarSelection = ({ onSelect }) => {
    return (
        <div className="grid grid-cols-4 gap-8 gap-x-14 py-4 mx-auto">
            {Object.entries(avatars).map(([name, src]) => (
                <img
                    key={name}
                    alt={name}
                    src={src}
                    className="rounded-full h-10 w-10 cursor-pointer"
                    onClick={() => onSelect(src)}
                />
            ))}
        </div>
    );
};

export default AvatarSelection;
