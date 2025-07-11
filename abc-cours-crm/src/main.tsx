import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Admin, Login, CouponSeriesCreate } from "./pages";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/admin/coupons" element={<Admin />} />
        <Route path="/admin/coupons/create" element={<CouponSeriesCreate />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>
);
