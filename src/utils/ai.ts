import { GoogleGenAI } from '@google/genai';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '../firebase';

export async function generateCurriculum(institution: string, department: string, level: string, userId: string) {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY as string });
    const prompt = `
      You are an academic curriculum assistant. Please generate a solid, realistic set of standard courses for a student in the ${department} department at ${institution} for ${level}.
      Generate courses for two semesters: "First Semester" and "Second Semester".
      
      Provide the response ONLY as a valid JSON array of two semester objects. Do not include markdown blocks or any other text.
      Schema:
      [
        {
          "semesterName": "First Semester",
          "courses": [
            { "code": "ABC 101", "title": "Introduction to XYZ", "units": 3 }
          ]
        },
        {
          "semesterName": "Second Semester",
          "courses": [
            { "code": "ABC 102", "title": "Advanced XYZ", "units": 3 }
          ]
        }
      ]
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
    });
    
    // Clean JSON response (sometimes models include markdown backticks)
    const rawText = response.text || '';
    const jsonMatch = rawText.match(/\[[\s\S]*\]/);
    const jsonText = jsonMatch ? jsonMatch[0] : rawText.trim();
    
    if (!jsonText) return null;

    const semestersInput: { semesterName: string, courses: { code: string, title: string, units: number }[] }[] = JSON.parse(jsonText);

    const createdSemesters = [];

    for (const sem of semestersInput) {
      const semRef = await addDoc(collection(db, 'semesters'), {
        userId,
        name: sem.semesterName,
        level: level,
        createdAt: new Date().toISOString()
      });

      for (const course of sem.courses) {
        await addDoc(collection(db, 'courses'), {
          userId,
          semesterId: semRef.id,
          code: course.code,
          title: course.title,
          units: course.units,
          grade: 'A', // default
          createdAt: new Date().toISOString()
        });
      }
      createdSemesters.push({ id: semRef.id, name: sem.semesterName, level });
    }
    return createdSemesters;
  } catch (error) {
    console.error("Failed to generate curriculum", error);
    throw error;
  }
}

export async function generateCoursesForSemester(institution: string, department: string, level: string, semesterName: string, userId: string, semesterId: string) {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY as string });
    const prompt = `
      You are an academic curriculum assistant. Please generate a solid, realistic set of standard courses for a student in the ${department} department at ${institution} for ${level}, specifically for the "${semesterName}".
      
      Provide the response ONLY as a valid JSON array of course objects. Do not include markdown blocks or any other text.
      Schema:
      [
        { "code": "ABC 101", "title": "Introduction to XYZ", "units": 3 }
      ]
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
    });
    
    const rawText = response.text || '';
    const jsonMatch = rawText.match(/\[[\s\S]*\]/);
    const jsonText = jsonMatch ? jsonMatch[0] : rawText.trim();
    
    if (!jsonText) return null;

    const coursesInput: { code: string, title: string, units: number }[] = JSON.parse(jsonText);

    const addedCourses = [];
    for (const course of coursesInput) {
      const courseRef = await addDoc(collection(db, 'courses'), {
        userId,
        semesterId,
        code: course.code,
        title: course.title,
        units: course.units,
        grade: 'A', // default
        createdAt: new Date().toISOString()
      });
      addedCourses.push({ id: courseRef.id, ...course });
    }
    return addedCourses;
  } catch (error) {
    console.error("Failed to generate courses", error);
    throw error;
  }
}

export async function scanTranscript(fileBase64: string, mimeType: string) {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY as string });
    const prompt = `
      You are an expert academic transcript parser. Extract courses from this transcript image/PDF.
      For each course, find:
      1. Course Code (e.g., MTH 101)
      2. Course Title (e.g., Mathematical Methods)
      3. Units/Credits (number)
      4. Grade received (e.g., A, B, C, F)
      5. Academic level if possible (e.g., 100 Level)
      6. Semester name if possible (e.g., First Semester)
      7. Category: Choose from 'General', 'Core', 'Elective', 'Practical' based on the course title/code.

      Provide the response ONLY as a valid JSON object with the following schema:
      {
        "semesters": [
          {
            "level": "100 Level",
            "name": "First Semester",
            "courses": [
              { "code": "MTH 101", "title": "Mathematical Methods", "units": 3, "grade": "A", "category": "Core" }
            ]
          }
        ]
      }
      If level or semester name is not clear, use best guesses like "100 Level" and "First Semester".
      Do not include markdown blocks or any other text.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3.1-pro-preview',
      contents: [
        {
          role: 'user',
          parts: [
            { text: prompt },
            {
              inlineData: {
                data: fileBase64.split(',')[1] || fileBase64,
                mimeType: mimeType
              }
            }
          ],
        }
      ],
    });

    const rawText = response.text || '';
    const jsonMatch = rawText.match(/\{[\s\S]*\}/);
    const jsonText = jsonMatch ? jsonMatch[0] : rawText.trim();
    
    if (!jsonText) return null;
    return JSON.parse(jsonText);
  } catch (error) {
    console.error("Failed to scan transcript", error);
    throw error;
  }
}
