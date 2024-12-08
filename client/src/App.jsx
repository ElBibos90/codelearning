import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Provider } from 'react-redux';
import { store } from './store';
import MainLayout from './components/layout/MainLayout';
import Home from './features/home/Home';
import Login from './features/auth/Login';
import Register from './features/auth/Register';
import CoursesList from './features/courses/CoursesList';
import CourseDetail from './features/courses/CourseDetail';
import LessonDetail from './features/lessons/LessonDetail';
import MyLearning from './features/learning/MyLearning';
import AdminCourseManager from './features/admin/AdminCourseManager';
import ProtectedRoute from './components/auth/ProtectedRoute';
import Profile from './features/profile/Profile';
import { Toaster } from './components/ui/Toast';
import { ThemeProvider } from './context/ThemeContext.jsx';  // aggiungi .jsx
import { ToastProvider } from './context/ToastContext.jsx';  // aggiungi .jsx

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000, // 5 minuti
      cacheTime: 10 * 60 * 1000, // 10 minuti
      retry: 1,
      refetchOnMount: 'always'
    },
    mutations: {
      retry: 1
    }
  }
});

function App() {
  return (
    <Provider store={store}>
      <ThemeProvider>
        <ToastProvider>
          <QueryClientProvider client={queryClient}>
            <Router>
              <Routes>
                {/* Public Routes */}
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                
                {/* Protected Routes */}
                <Route path="/" element={
                  <MainLayout>
                    <Home />
                  </MainLayout>
                } />

                <Route path="/courses" element={
                  <ProtectedRoute>
                    <MainLayout>
                      <CoursesList />
                    </MainLayout>
                  </ProtectedRoute>
                } />

                <Route path="/courses/:courseId" element={
                  <ProtectedRoute>
                    <MainLayout>
                      <CourseDetail />
                    </MainLayout>
                  </ProtectedRoute>
                } />

                <Route path="/profile" element={
                  <ProtectedRoute>
                    <MainLayout>
                      <Profile />
                    </MainLayout>
                  </ProtectedRoute>
                } />
                
                <Route path="/courses/:courseId/lessons/:lessonId" element={
                  <ProtectedRoute>
                    <MainLayout>
                      <LessonDetail />
                    </MainLayout>
                  </ProtectedRoute>
                } />

                <Route path="/my-learning" element={
                  <ProtectedRoute>
                    <MainLayout>
                      <MyLearning />
                    </MainLayout>
                  </ProtectedRoute>
                } />

                {/* Admin Routes */}
                <Route path="/admin/*" element={
                  <ProtectedRoute isAdmin>
                    <AdminCourseManager />
                  </ProtectedRoute>
                } />
              </Routes>
              <Toaster />
            </Router>
          </QueryClientProvider>
        </ToastProvider>
      </ThemeProvider>
    </Provider>
  );
}

export default App;