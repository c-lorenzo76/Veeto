import './App.css';
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Home } from "./pages/Home";
import { Q1 } from "./pages/Q1";
import { Create } from "./pages/Create";
import { Join } from "./pages/Join";
import { Lobby } from "./pages/Lobby";


const App = () => {
    return(
        <BrowserRouter>
            <Routes>
                <Route index element={<Home />} />
                <Route path={"Q1"} element={<Q1 />} />
                <Route path={"Create"} element={<Create />} />
                <Route path={"Join"} element={<Join />} />
                <Route path={"Lobby"} element={<Lobby />} />
            </Routes>
        </BrowserRouter>
    )

};
export default App;