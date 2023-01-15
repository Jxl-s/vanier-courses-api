import { useState } from "react";
import { BrowserRouter, Route, Router, Routes } from "react-router-dom";
import reactLogo from "./assets/react.svg";
import MainLayout from "./layouts/main";
import Index from "./pages";
import Schedules from "./pages/schedule";

function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/">
                    <Route index element={<Index />} />
                    <Route path="schedule" element={<Schedules />} />
                </Route>
            </Routes>
        </BrowserRouter>
    );
}

export default App;
