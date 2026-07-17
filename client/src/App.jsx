import './App.css';
import {BrowserRouter, Routes, Route} from "react-router-dom";
import {Home} from "./pages/Home";
import {Create} from "./pages/Create";
import {Join} from "./pages/Join";
import {Lobby} from "./pages/Lobby";
import {Questions} from "./pages/Questions";
import {Results} from "./pages/Results";
import {SocketProvider} from "./SocketContext";
import {LanguageProvider} from "./context/LanguageContext";
import { Toaster } from "@/components/ui/toaster";



const App = () => {
    return (
        <BrowserRouter>
            <LanguageProvider>
                <SocketProvider>
                    <Routes>
                        <Route index element={<Home/>}/>
                        <Route path={"Create"} element={<Create/>}/>
                        <Route path={"Join"} element={<Join/>}/>
                        <Route path={"Lobby/:code"} element={<Lobby/>}/>
                        <Route path={"Questions/:code"} element={<Questions/>}/>
                        <Route path={"Results/:code"} element={<Results/>}/>
                    </Routes>
                </SocketProvider>
                <Toaster />
            </LanguageProvider>
        </BrowserRouter>
    )

};
export default App;