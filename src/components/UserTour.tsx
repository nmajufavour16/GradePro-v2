import React, { useEffect } from 'react';
import { driver } from 'driver.js';
import 'driver.js/dist/driver.css';
import { useAuth } from '../contexts/AuthContext';
import { useLocation } from 'react-router-dom';

export default function UserTour() {
  const { profile, updateProfile } = useAuth();
  const location = useLocation();

  useEffect(() => {
    // Only trigger on the dashboard and only if not completed
    if (location.pathname !== '/dashboard' || !profile || profile.hasCompletedTour) return;

    const driverObj = driver({
      showProgress: true,
      steps: [
        { 
          element: '#tour-cgpa', 
          popover: { 
            title: 'Your Academic Overview', 
            description: 'This is where you see your current CGPA. It updates automatically as you add grades.', 
            side: 'bottom' 
          } 
        },
        { 
          element: '#tour-target', 
          popover: { 
            title: 'Set Your Goal', 
            description: 'Define your target CGPA and track how close you are to achieving it.', 
            side: 'bottom' 
          } 
        },
        { 
          element: '#tour-semesters', 
          popover: { 
            title: 'Manage Courses', 
            description: 'Add and organize your courses by semester. You can also use AI to auto-generate standard curriculums!', 
            side: 'right' 
          } 
        },
        { 
          element: '#tour-ai-button', 
          popover: { 
            title: 'AI Study Assistant', 
            description: 'Need help with a subject? Click here to chat with GradePro AI, your personal academic tutor.', 
            side: 'left' 
          } 
        },
        { 
          element: '#tour-profile', 
          popover: { 
            title: 'Your Account', 
            description: 'Manage your profile and settings here.', 
            side: 'top' 
          } 
        }
      ],
      onDestroyed: async () => {
        // Mark tour as completed in the DB
        try {
          await updateProfile({ hasCompletedTour: true });
        } catch (error) {
          console.error('Failed to update tour status:', error);
        }
      }
    });

    // Start the tour with a slight delay to ensure elements are rendered
    const timer = setTimeout(() => {
      driverObj.drive();
    }, 1500);

    return () => clearTimeout(timer);
  }, [profile, updateProfile, location.pathname]);

  return null;
}
