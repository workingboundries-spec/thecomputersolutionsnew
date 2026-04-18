import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Admin from "./pages/Admin";
import AdminLogin from "./pages/AdminLogin";
import NotFound from "./pages/NotFound";
import ProtectedRoute from "./components/ProtectedRoute";

import CrmLogin from "./crm/pages/CrmLogin";
import CrmLayout from "./crm/components/CrmLayout";
import CrmProtected from "./crm/components/CrmProtected";
import CrmAdminProtected from "./crm/components/CrmAdminProtected";
import CrmDashboard from "./crm/pages/CrmDashboard";
import CrmEnquiries from "./crm/pages/CrmEnquiries";
import CrmQuotations from "./crm/pages/CrmQuotations";
import CrmSales from "./crm/pages/CrmSales";
import CrmCustomers from "./crm/pages/CrmCustomers";
import CrmCatalogue from "./crm/pages/CrmCatalogue";
import CrmStock from "./crm/pages/CrmStock";
import CrmServices from "./crm/pages/CrmServices";
import CrmWarranty from "./crm/pages/CrmWarranty";
import CrmAdmin from "./crm/pages/CrmAdmin";
import QuoteShare from "./pages/QuoteShare";
import PublicQuoteView from "./pages/PublicQuoteView";
import PublicSalesForm from "./pages/PublicSalesForm";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin" element={<ProtectedRoute><Admin /></ProtectedRoute>} />

          {/* CRM */}
          <Route path="/crm" element={<CrmLogin />} />
          <Route element={<CrmProtected><CrmLayout /></CrmProtected>}>
            <Route path="/crm/dashboard" element={<CrmDashboard />} />
            <Route path="/crm/enquiries" element={<CrmEnquiries />} />
            <Route path="/crm/quotations" element={<CrmQuotations />} />
            <Route path="/crm/sales" element={<CrmSales />} />
            <Route path="/crm/catalogue" element={<CrmCatalogue />} />
            <Route path="/crm/stock" element={<CrmStock />} />
            <Route path="/crm/services" element={<CrmServices />} />
            <Route path="/crm/warranty" element={<CrmWarranty />} />
            <Route path="/crm/customers" element={<CrmCustomers />} />
            <Route path="/crm/admin" element={<CrmAdminProtected><CrmAdmin /></CrmAdminProtected>} />
          </Route>

          {/* Public quote share (catalogue picker links) */}
          <Route path="/q/:uuid" element={<QuoteShare />} />
          {/* Public quotation view */}
          <Route path="/q/quote/:id" element={<PublicQuoteView />} />

          {/* Public customer sales form */}
          <Route path="/sales-form" element={<PublicSalesForm />} />

          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
