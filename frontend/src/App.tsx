import { BrowserRouter, Route, Router, Routes } from "react-router-dom";
import Schedules from "./pages/schedule";

function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/">
                    <Route index element={<Schedules />} />
                </Route>
            </Routes>
        </BrowserRouter>
    );
}

export default App;
