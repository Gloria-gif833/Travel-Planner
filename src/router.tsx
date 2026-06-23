import { BrowserRouter, Routes, Route } from 'react-router-dom';
import AppLayout from './AppLayout';
import {
  HomePage,
  DialogPage,
  UploadPage,
  ItineraryPage,
  VersionPage,
  ExportPage,
  SharePage,
  SharedViewPage,
  LoginPage,
  RegisterPage,
  QuickRequirementPage,
} from './pages';
import AuthGuard from './components/AuthGuard/AuthGuard';

export default function Router() {
  return (
    <BrowserRouter>
      <Routes>
        {/* 公开分享页（无侧边栏，无需登录） */}
        <Route path="/s/:code" element={<SharedViewPage />} />

        {/* 登录/注册（无侧边栏） */}
        <Route
          path="/login"
          element={
            <AuthGuard requireAuth={false}>
              <LoginPage />
            </AuthGuard>
          }
        />
        <Route
          path="/register"
          element={
            <AuthGuard requireAuth={false}>
              <RegisterPage />
            </AuthGuard>
          }
        />

        {/* 主应用（有侧边栏，支持匿名访问） */}
        <Route element={<AppLayout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/dialog" element={<DialogPage />} />
          <Route path="/quick-requirement" element={<QuickRequirementPage />} />
          <Route path="/upload" element={<UploadPage />} />
          <Route path="/itinerary" element={<ItineraryPage />} />
          <Route path="/version" element={<VersionPage />} />
          <Route path="/export" element={<ExportPage />} />
          <Route path="/share" element={<SharePage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}