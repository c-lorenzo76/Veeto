import './App.css';
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Home } from "./pages/Home";
import { Q1 } from "./pages/Q1";
import { Create } from "./pages/Create";


const App = () => {
    return(
        <BrowserRouter>
            <Routes>
                <Route index element={<Home />} />
                <Route path="/Q1" element={<Q1 />} />
                <Route path={"Create"} element={<Create />} />
            </Routes>
        </BrowserRouter>
    )

};
export default App;