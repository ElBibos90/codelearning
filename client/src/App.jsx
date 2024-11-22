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

const queryClient = new QueryClient();

function App() {
  return (
    <Provider store={store}>
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
        </Router>
      </QueryClientProvider>
    </Provider>
  );
}

export default App;