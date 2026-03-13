import { Course, Semester } from '../types';

export function calculateGPA(courses: Course[]): number {
  if (courses.length === 0) return 0;
  
  let totalPoints = 0;
  let totalUnits = 0;

  courses.forEach(course => {
    totalPoints += course.gradePoint * course.units;
    totalUnits += course.units;
  });

  return totalUnits === 0 ? 0 : Number((totalPoints / totalUnits).toFixed(2));
}

export function calculateCGPA(semesters: Semester[], allCourses: Course[]): number {
  if (semesters.length === 0 || allCourses.length === 0) return 0;

  let totalPoints = 0;
  let totalUnits = 0;

  allCourses.forEach(course => {
    totalPoints += course.gradePoint * course.units;
    totalUnits += course.units;
  });

  return totalUnits === 0 ? 0 : Number((totalPoints / totalUnits).toFixed(2));
}

export function getGradePoint(grade: string, scale: number = 5.0): number {
  const upperGrade = grade.toUpperCase();
  if (scale === 5.0) {
    switch (upperGrade) {
      case 'A': return 5.0;
      case 'B': return 4.0;
      case 'C': return 3.0;
      case 'D': return 2.0;
      case 'E': return 1.0;
      case 'F': return 0.0;
      default: return 0.0;
    }
  } else if (scale === 4.0) {
    switch (upperGrade) {
      case 'A': return 4.0;
      case 'B': return 3.0;
      case 'C': return 2.0;
      case 'D': return 1.0;
      case 'F': return 0.0;
      default: return 0.0;
    }
  }
  return 0.0;
}
