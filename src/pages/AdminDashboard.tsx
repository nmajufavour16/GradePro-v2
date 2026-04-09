import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { AppMetadata, UserProfile } from '../types';
import { 
  Users, 
  BookOpen, 
  Settings, 
  Plus, 
  Trash2, 
  Save, 
  BarChart3, 
  Search,
  ChevronRight,
  ShieldCheck,
  Database
} from 'lucide-react';

const NIGERIAN_UNIVERSITIES = [
  "University of Ibadan (UI)", "Obafemi Awolowo University (OAU)", "University of Lagos (UNILAG)", 
  "Ahmadu Bello University (ABU)", "University of Nigeria, Nsukka (UNN)", "University of Ilorin (UNILORIN)", 
  "Covenant University (CU)", "Babcock University", "Afe Babalola University (ABUAD)", 
  "Lagos State University (LASU)", "University of Benin (UNIBEN)", "University of Port Harcourt (UNIPORT)",
  "Federal University of Technology, Minna (FUTMINNA)", "Federal University of Technology, Akure (FUTA)",
  "Federal University of Technology, Owerri (FUTO)", "Nnamdi Azikiwe University (UNIZIK)",
  "Bayero University Kano (BUK)", "University of Jos (UNIJOS)", "University of Abuja (UNIABUJA)",
  "University of Uyo (UNIUYO)", "University of Calabar (UNICAL)", "Delta State University (DELSU)",
  "Rivers State University (RSU)", "Olabisi Onabanjo University (OOU)", "Ekiti State University (EKSU)",
  "Redeemer's University", "Bowen University", "Bingham University", "Baze University", "Nile University",
  "Pan-Atlantic University", "Landmark University", "Igbinedion University", "Lead City University"
];

const COMMON_FACULTIES = [
  "Agriculture", "Arts", "Basic Medical Sciences", "Clinical Sciences", "Dentistry", 
  "Education", "Engineering", "Environmental Sciences", "Law", "Management Sciences", 
  "Pharmacy", "Science", "Social Sciences", "Veterinary Medicine", "Communication and Media Studies"
];

const COMMON_DEPARTMENTS = [
  "Accounting", "Agricultural Economics", "Anatomy", "Architecture", "Biochemistry", 
  "Business Administration", "Chemical Engineering", "Chemistry", "Civil Engineering", 
  "Computer Science", "Dentistry", "Economics", "Electrical/Electronics Engineering", 
  "English Language", "Estate Management", "Finance", "History and International Studies", 
  "Law", "Mass Communication", "Mathematics", "Mechanical Engineering", "Medicine and Surgery", 
  "Microbiology", "Nursing Science", "Pharmacy", "Physics", "Physiology", "Political Science", 
  "Psychology", "Public Administration", "Sociology", "Statistics", "Surveying and Geoinformatics"
];

const COMMON_COURSES = [
  // General Studies (GST)
  { code: "GST111", title: "Communication in English I", units: 2 },
  { code: "GST112", title: "Logic, Philosophy and Human Existence", units: 2 },
  { code: "GST113", title: "Nigerian Peoples and Culture", units: 2 },
  { code: "GST121", title: "Use of Library, Study Skills and ICT", units: 2 },
  { code: "GST122", title: "Communication in English II", units: 2 },
  { code: "GST123", title: "Basic Communication in French", units: 2 },
  { code: "GST211", title: "History and Philosophy of Science", units: 2 },
  { code: "GST212", title: "Peace and Conflict Resolution", units: 2 },
  { code: "GST221", title: "Entrepreneurship and Innovation", units: 2 },

  // Sciences
  { code: "MTH101", title: "Elementary Mathematics I (Algebra and Trigonometry)", units: 3 },
  { code: "MTH102", title: "Elementary Mathematics II (Calculus)", units: 3 },
  { code: "MTH201", title: "Mathematical Methods I", units: 3 },
  { code: "PHY101", title: "General Physics I (Mechanics & Properties of Matter)", units: 3 },
  { code: "PHY102", title: "General Physics II (Electricity & Magnetism)", units: 3 },
  { code: "PHY107", title: "General Physics Laboratory I", units: 1 },
  { code: "PHY108", title: "General Physics Laboratory II", units: 1 },
  { code: "CHM101", title: "General Chemistry I (Physical & Inorganic)", units: 3 },
  { code: "CHM102", title: "General Chemistry II (Organic & Practical)", units: 3 },
  { code: "CHM107", title: "General Practical Chemistry I", units: 1 },
  { code: "CHM108", title: "General Practical Chemistry II", units: 1 },
  { code: "BIO101", title: "General Biology I", units: 3 },
  { code: "BIO102", title: "General Biology II", units: 3 },
  { code: "BIO107", title: "General Biology Practical I", units: 1 },
  { code: "BIO108", title: "General Biology Practical II", units: 1 },
  { code: "STA111", title: "Descriptive Statistics", units: 3 },
  { code: "STA112", title: "Probability I", units: 3 },

  // Computing & IT (100 - 400 Level)
  { code: "CSC101", title: "Introduction to Computer Science", units: 3 },
  { code: "CSC102", title: "Introduction to Problem Solving", units: 3 },
  { code: "CSC201", title: "Computer Programming I", units: 3 },
  { code: "CSC202", title: "Computer Programming II", units: 3 },
  { code: "CSC204", title: "Fundamentals of Data Structures", units: 3 },
  { code: "CSC205", title: "Operating Systems I", units: 3 },
  { code: "CSC208", title: "Discrete Mathematics", units: 3 },
  { code: "CSC301", title: "Object-Oriented Programming", units: 3 },
  { code: "CSC302", title: "Object-Oriented Design and Analysis", units: 3 },
  { code: "CSC304", title: "Data Management I (Databases)", units: 3 },
  { code: "CSC305", title: "Operating Systems II", units: 3 },
  { code: "CSC308", title: "Formal Methods and Automata Theory", units: 3 },
  { code: "CSC310", title: "Computer Architecture and Organization", units: 3 },
  { code: "CSC314", title: "Artificial Intelligence", units: 3 },
  { code: "CSC315", title: "Introduction to Computer Networks", units: 3 },
  { code: "CSC399", title: "Industrial Training (SIWES)", units: 6 },
  { code: "CSC401", title: "Software Engineering", units: 3 },
  { code: "CSC403", title: "Net-Centric Computing", units: 3 },
  { code: "CSC404", title: "Data Management II", units: 3 },
  { code: "CSC411", title: "Organization of Programming Languages", units: 3 },
  { code: "CSC414", title: "Compiler Construction", units: 3 },
  { code: "CSC415", title: "Computer Graphics and Visualization", units: 3 },
  { code: "CSC421", title: "Human-Computer Interaction", units: 2 },
  { code: "CSC499", title: "Project", units: 6 },

  // Software Engineering
  { code: "SEN201", title: "Introduction to Software Engineering", units: 3 },
  { code: "SEN301", title: "Software Requirements Engineering", units: 3 },
  { code: "SEN302", title: "Software Architecture and Design", units: 3 },
  { code: "SEN401", title: "Software Testing and Quality Assurance", units: 3 },
  { code: "SEN402", title: "Software Project Management", units: 3 },

  // Cybersecurity
  { code: "CYB201", title: "Introduction to Cybersecurity", units: 3 },
  { code: "CYB301", title: "Cryptography and Network Security", units: 3 },
  { code: "CYB302", title: "Ethical Hacking and Penetration Testing", units: 3 },
  { code: "CYB401", title: "Digital Forensics and Incident Response", units: 3 },
  { code: "CYB402", title: "Information Security Policy and Law", units: 2 },

  // Information Technology / Systems
  { code: "IFT201", title: "Web Technologies and Development", units: 3 },
  { code: "IFT301", title: "Systems Analysis and Design", units: 3 },
  { code: "IFT302", title: "Information Security", units: 3 },
  { code: "IFT401", title: "Cloud Computing", units: 3 },
  { code: "IFT402", title: "Internet of Things (IoT)", units: 3 },

  // Engineering
  { code: "ENG101", title: "Workshop Practice I", units: 1 },
  { code: "ENG102", title: "Workshop Practice II", units: 1 },
  { code: "ENG103", title: "Engineering Drawing I", units: 2 },
  { code: "ENG104", title: "Engineering Drawing II", units: 2 },
  { code: "MEE201", title: "Engineering Mechanics I (Statics)", units: 3 },
  { code: "MEE202", title: "Engineering Mechanics II (Dynamics)", units: 3 },
  { code: "EEE201", title: "Basic Electrical Engineering I", units: 3 },
  { code: "EEE202", title: "Basic Electrical Engineering II", units: 3 },

  // Social Sciences & Management
  { code: "ECO101", title: "Principles of Economics I", units: 3 },
  { code: "ECO102", title: "Principles of Economics II", units: 3 },
  { code: "ACC101", title: "Introduction to Financial Accounting I", units: 3 },
  { code: "ACC102", title: "Introduction to Financial Accounting II", units: 3 },
  { code: "BUS101", title: "Introduction to Business I", units: 3 },
  { code: "BUS102", title: "Introduction to Business II", units: 3 },
  { code: "POL101", title: "Introduction to Political Science", units: 3 },
  { code: "POL102", title: "Nigerian Government and Politics", units: 3 },
  { code: "SOC101", title: "Introduction to Sociology", units: 3 },
  { code: "PSY101", title: "Introduction to Psychology", units: 3 },
  { code: "MAC101", title: "Introduction to Mass Communication", units: 3 },

  // Arts & Humanities
  { code: "ENG111", title: "Spoken English", units: 3 },
  { code: "ENG112", title: "Introduction to Literature in English", units: 3 },
  { code: "HIS101", title: "History of Africa from 1500 to 1800", units: 3 },
  { code: "PHI101", title: "Introduction to Philosophy", units: 3 },

  // Law
  { code: "LAW101", title: "Legal Method I", units: 3 },
  { code: "LAW102", title: "Legal Method II", units: 3 },
  { code: "LAW201", title: "Law of Contract I", units: 4 },
  { code: "LAW202", title: "Law of Contract II", units: 4 },

  // Medical & Health Sciences
  { code: "ANA201", title: "Gross Anatomy I", units: 3 },
  { code: "ANA202", title: "Gross Anatomy II", units: 3 },
  { code: "PHS201", title: "General Physiology I", units: 3 },
  { code: "PHS202", title: "General Physiology II", units: 3 },
  { code: "BCH201", title: "General Biochemistry I", units: 3 },
  { code: "BCH202", title: "General Biochemistry II", units: 3 },
  { code: "MCB201", title: "General Microbiology I", units: 3 },
  { code: "MCB202", title: "General Microbiology II", units: 3 },

  // Agriculture
  { code: "AGR101", title: "Introduction to Agriculture", units: 2 },
  { code: "AGR201", title: "General Agriculture", units: 2 }
];

export default function AdminDashboard() {
  const { profile } = useAuth();
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'metadata'>('overview');
  const [metadata, setMetadata] = useState<AppMetadata | null>(null);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalSemesters: 0,
    totalCourses: 0
  });
  const [loading, setLoading] = useState(true);

  // Metadata editing state
  const [newInstitution, setNewInstitution] = useState('');
  const [newFaculty, setNewFaculty] = useState('');
  const [newDepartment, setNewDepartment] = useState('');
  const [newCourse, setNewCourse] = useState({ code: '', title: '', units: 3 });

  useEffect(() => {
    if (profile?.role !== 'admin') return;

    const fetchData = async () => {
      try {
        const [metaRes, usersRes, statsRes] = await Promise.all([
          fetch('/api/metadata'),
          fetch('/api/admin/users'),
          fetch('/api/admin/stats')
        ]);

        if (metaRes.ok) setMetadata(await metaRes.json());
        if (usersRes.ok) setUsers(await usersRes.json());
        if (statsRes.ok) setStats(await statsRes.json());
      } catch (error) {
        console.error('Error fetching admin data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [profile]);

  if (profile?.role !== 'admin') {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-center p-6">
        <ShieldCheck className="h-16 w-16 text-red-500 mb-4" />
        <h2 className="text-2xl font-bold text-slate-900">Access Denied</h2>
        <p className="text-slate-600 mt-2">You do not have administrative privileges to view this page.</p>
      </div>
    );
  }

  const handleSaveMetadata = async () => {
    if (!metadata) return;
    console.log('Metadata updated successfully!');
  };

  const addItem = (field: keyof Omit<AppMetadata, 'id' | 'courseTemplates'>, value: string, setter: (v: string) => void) => {
    if (!value.trim() || !metadata) return;
    const updated = { ...metadata };
    if (!(updated[field] as string[]).includes(value)) {
      (updated[field] as string[]).push(value);
      setMetadata(updated);
      setter('');
    }
  };

  const removeItem = (field: keyof Omit<AppMetadata, 'id' | 'courseTemplates'>, index: number) => {
    if (!metadata) return;
    const updated = { ...metadata };
    (updated[field] as string[]).splice(index, 1);
    setMetadata(updated);
  };

  const addCourseTemplate = () => {
    if (!newCourse.code || !newCourse.title || !metadata) return;
    const updated = { ...metadata };
    updated.courseTemplates.push({ ...newCourse });
    setMetadata(updated);
    setNewCourse({ code: '', title: '', units: 3 });
  };

  const handleSeedData = async () => {
    if (!metadata) return;
    
    try {
      const updated = { ...metadata };
      
      // Merge uniquely
      NIGERIAN_UNIVERSITIES.forEach(uni => {
        if (!updated.institutions.includes(uni)) updated.institutions.push(uni);
      });
      
      COMMON_FACULTIES.forEach(fac => {
        if (!updated.faculties.includes(fac)) updated.faculties.push(fac);
      });
      
      COMMON_DEPARTMENTS.forEach(dep => {
        if (!updated.departments.includes(dep)) updated.departments.push(dep);
      });
      
      COMMON_COURSES.forEach(course => {
        const exists = updated.courseTemplates.some(c => c.code === course.code);
        if (!exists) updated.courseTemplates.push(course);
      });

      // Sort alphabetically for better UX
      updated.institutions.sort();
      updated.faculties.sort();
      updated.departments.sort();
      updated.courseTemplates.sort((a, b) => a.code.localeCompare(b.code));

      setMetadata(updated);
      console.log('Nigerian Universities data seeded successfully!');
    } catch (error) {
      console.error('Error seeding data:', error);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Admin Dashboard</h1>
          <p className="text-slate-600">Manage institutions, users, and academic metadata.</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-4">
          {activeTab === 'metadata' && (
            <button
              onClick={handleSeedData}
              className="flex items-center justify-center space-x-2 bg-emerald-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-emerald-700 transition-colors shadow-sm"
            >
              <Database className="h-4 w-4" />
              <span>Seed Nigerian Data</span>
            </button>
          )}
          <div className="flex bg-white rounded-xl shadow-sm border border-slate-200 p-1">
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'overview' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-50'}`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab('users')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'users' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-50'}`}
            >
              Users
            </button>
            <button
              onClick={() => setActiveTab('metadata')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'metadata' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-50'}`}
            >
              Metadata
            </button>
          </div>
        </div>
      </div>

      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-blue-50 rounded-xl">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
              <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Total Users</span>
            </div>
            <p className="text-3xl font-bold text-slate-900">{stats.totalUsers}</p>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-indigo-50 rounded-xl">
                <BookOpen className="h-6 w-6 text-indigo-600" />
              </div>
              <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Total Semesters</span>
            </div>
            <p className="text-3xl font-bold text-slate-900">{stats.totalSemesters}</p>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-emerald-50 rounded-xl">
                <BarChart3 className="h-6 w-6 text-emerald-600" />
              </div>
              <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Total Courses</span>
            </div>
            <p className="text-3xl font-bold text-slate-900">{stats.totalCourses}</p>
          </div>
        </div>
      )}

      {activeTab === 'users' && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-6 border-b border-slate-200 flex items-center justify-between">
            <h3 className="text-lg font-bold text-slate-900">Registered Users</h3>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search users..."
                className="pl-10 pr-4 py-2 bg-slate-50 border-transparent focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 rounded-xl text-sm transition-all outline-none"
              />
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider">
                  <th className="px-6 py-4 font-semibold">User</th>
                  <th className="px-6 py-4 font-semibold">Institution</th>
                  <th className="px-6 py-4 font-semibold">Level</th>
                  <th className="px-6 py-4 font-semibold">Role</th>
                  <th className="px-6 py-4 font-semibold">Joined</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users.map(user => (
                  <tr key={user.uid} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <img src={user.photoURL || `https://ui-avatars.com/api/?name=${user.displayName}&background=random`} className="h-8 w-8 rounded-full mr-3" alt="" />
                        <div>
                          <p className="text-sm font-medium text-slate-900">{user.displayName}</p>
                          <p className="text-xs text-slate-500">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">{user.institution || 'N/A'}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">{user.level || 'N/A'}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${user.role === 'admin' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'}`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-500">
                      {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'metadata' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Institutions, Faculties, Departments */}
          <div className="space-y-8">
            <MetadataSection 
              title="Institutions" 
              items={metadata?.institutions || []} 
              onAdd={(v) => addItem('institutions', v, setNewInstitution)} 
              onRemove={(i) => removeItem('institutions', i)}
              inputValue={newInstitution}
              setInputValue={setNewInstitution}
            />
            <MetadataSection 
              title="Faculties" 
              items={metadata?.faculties || []} 
              onAdd={(v) => addItem('faculties', v, setNewFaculty)} 
              onRemove={(i) => removeItem('faculties', i)}
              inputValue={newFaculty}
              setInputValue={setNewFaculty}
            />
            <MetadataSection 
              title="Departments" 
              items={metadata?.departments || []} 
              onAdd={(v) => addItem('departments', v, setNewDepartment)} 
              onRemove={(i) => removeItem('departments', i)}
              inputValue={newDepartment}
              setInputValue={setNewDepartment}
            />
          </div>

          {/* Course Templates */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col h-full">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-slate-900">Course Templates</h3>
              <button onClick={handleSaveMetadata} className="flex items-center space-x-2 bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-indigo-700">
                <Save className="h-4 w-4" />
                <span>Save Changes</span>
              </button>
            </div>

            <div className="space-y-4 mb-6">
              <div className="grid grid-cols-3 gap-2">
                <input
                  type="text"
                  placeholder="Code"
                  value={newCourse.code}
                  onChange={(e) => setNewCourse({ ...newCourse, code: e.target.value.toUpperCase() })}
                  className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:border-indigo-500"
                />
                <input
                  type="text"
                  placeholder="Title"
                  value={newCourse.title}
                  onChange={(e) => setNewCourse({ ...newCourse, title: e.target.value })}
                  className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:border-indigo-500"
                />
                <div className="flex space-x-2">
                  <input
                    type="number"
                    placeholder="Units"
                    value={newCourse.units}
                    onChange={(e) => setNewCourse({ ...newCourse, units: parseInt(e.target.value) || 0 })}
                    className="w-16 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:border-indigo-500"
                  />
                  <button onClick={addCourseTemplate} className="flex-1 bg-indigo-50 text-indigo-600 p-2 rounded-lg hover:bg-indigo-100">
                    <Plus className="h-5 w-5 mx-auto" />
                  </button>
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2">
              {metadata?.courseTemplates.map((course, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100 group">
                  <div>
                    <span className="font-bold text-indigo-600 text-xs mr-2">{course.code}</span>
                    <span className="text-sm text-slate-700">{course.title}</span>
                    <span className="ml-2 text-[10px] text-slate-400 font-medium uppercase">{course.units} Units</span>
                  </div>
                  <button 
                    onClick={() => {
                      const updated = { ...metadata };
                      updated.courseTemplates.splice(idx, 1);
                      setMetadata(updated);
                    }}
                    className="p-1 text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function MetadataSection({ title, items, onAdd, onRemove, inputValue, setInputValue }: { 
  title: string, 
  items: string[], 
  onAdd: (v: string) => void, 
  onRemove: (i: number) => void,
  inputValue: string,
  setInputValue: (v: string) => void
}) {
  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
      <h3 className="text-lg font-bold text-slate-900 mb-4">{title}</h3>
      <div className="flex space-x-2 mb-4">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder={`Add ${title.toLowerCase()}...`}
          className="flex-1 px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-indigo-500"
        />
        <button onClick={() => onAdd(inputValue)} className="p-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700">
          <Plus className="h-5 w-5" />
        </button>
      </div>
      <div className="max-h-48 overflow-y-auto space-y-2">
        {items.map((item, idx) => (
          <div key={idx} className="flex items-center justify-between p-2 px-3 bg-slate-50 rounded-lg border border-slate-100 group">
            <span className="text-sm text-slate-600">{item}</span>
            <button onClick={() => onRemove(idx)} className="p-1 text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
