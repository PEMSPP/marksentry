const { useState, useEffect } = React;
const { createRoot } = ReactDOM;

// Sample school data
const schools = [
    { name: 'Talaricheruvu' },
    { name: 'Boyareddypalli' },
    { name: 'Mantapampalli' },
    { name: 'Ganesh Pahad' },
    { name: 'Tandur' },
    { name: 'ALL' } // Placeholder for combined data
];

// Maximum marks for each column
const maxMarks = 100;

// Grade calculation functions
const calculateTotalGrade = grandTotal => {
    if (grandTotal >= 360) return 'A1';
if (grandTotal >= 320) return 'A2';
if (grandTotal >= 280) return 'B1';
if (grandTotal >= 240) return 'B2';
if (grandTotal >= 200) return 'C1';
if (grandTotal >= 160) return 'C2';
if (grandTotal >= 120) return 'D1';
return 'D2';
}

const calculateGPA = grandTotal => (grandTotal / 600 * 10).toFixed(1); // Assuming total max marks of 600 across 6 subjects
const calculatePercentage = grandTotal => ((grandTotal / 600) * 100).toFixed(1);

// React component
function StudentMarksEntry() {
    const [selectedSchool, setSelectedSchool] = useState('');
    const [students, setStudents] = useState([]);
    const [filteredStudents, setFilteredStudents] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        const fetchSchoolDataFromFirebase = async (school) => {
            const response = await axios.get(`https://marks-81ffd-default-rtdb.firebaseio.com/2024/SA-1/schools/${school}/UKG.json`);
            const data = response.data || [];
            return Object.keys(data).map((key, index) => ({
                sno: index + 1,
                studentName: data[key].studentName,
                penNumber: data[key].penNumber,
                section: data[key].section,
                telugu: data[key].telugu || [''],
                english: data[key].english || [''],
                mathematics: data[key].mathematics || [''],
                evs: data[key].evs|| [''],
                colouring: data[key].colouring || [''],
                rhymes: data[key].rhymes || [''],
                grandTotal: data[key].grandTotal || 0,
                totalGrade: data[key].totalGrade || '',
                gpa: data[key].gpa || 0,
                percentage: data[key].percentage || 0
            }));
        };

        const fetchAllDataFromFirebase = async () => {
            const allData = [];
            let snoCounter = 1;
            for (const school of schools.slice(0, -1)) {
                const schoolData = await fetchSchoolDataFromFirebase(school.name);
                schoolData.forEach(student => {
                    student.sno = snoCounter++;
                    allData.push(student);
                });
            }
            setStudents(allData);
            setFilteredStudents(allData);
        };

        if (selectedSchool) {
            if (selectedSchool === 'ALL') {
                fetchAllDataFromFirebase();
            } else {
                fetchSchoolDataFromFirebase(selectedSchool).then(data => {
                    setStudents(data);
                    setFilteredStudents(data);
                });
            }
        }
    }, [selectedSchool]);

    const handleInputChange = (index, subject, value) => {
        const newStudents = [...students];
        const student = newStudents[index];
    
        // Validate input: only numbers or 'A' allowed, and handle empty values
        if (value === '' || value === 'A' || (!isNaN(value) && value >= 0 && value <= maxMarks)) {
            let finalValue = value;
    
            // Apply transformations if input is a two-digit number
            if (!isNaN(value) && value.length === 2) {
                if (subject === 'colouring' || subject === 'rhymes') {
                    // Multiply by 4 for 'colouring' and 'rhymes'
                    finalValue = Math.min(Number(value) * 4, maxMarks);
                } else {
                    // Double the value for other subjects
                    finalValue = Math.min(Number(value) * 2, maxMarks);
                }
            }
    
            // Set the final value in the student data
            student[subject][0] = finalValue;
        } else {
            alert(`Please enter a valid number (0-${maxMarks}) or "A" for absent.`);
            return;
        }
    
        // Update grand total, grade, GPA, and percentage based on the new values
        student.grandTotal = ["telugu", "english", "mathematics", "evs", "colouring", "rhymes"].reduce((acc, subj) => {
            return acc + (student[subj][0] === 'A' || student[subj][0] === '' ? 0 : Number(student[subj][0] || 0));
        }, 0);
    
        student.totalGrade = calculateTotalGrade(student.grandTotal);
        student.gpa = calculateGPA(student.grandTotal);
        student.percentage = calculatePercentage(student.grandTotal);
    
        // Update state
        setStudents(newStudents);
        setFilteredStudents(newStudents);
    };
    
    const handleKeyDown = (e, index, subject) => {
        const subjectOrder = ["telugu", "english", "mathematics", "evs", "colouring", "rhymes"];
        const currentSubjectIndex = subjectOrder.indexOf(subject);

        if (e.key === "ArrowRight" && currentSubjectIndex < subjectOrder.length - 1) {
            document.getElementById(`input-${index}-${subjectOrder[currentSubjectIndex + 1]}`).focus();
        } else if (e.key === "ArrowLeft" && currentSubjectIndex > 0) {
            document.getElementById(`input-${index}-${subjectOrder[currentSubjectIndex - 1]}`).focus();
        } else if (e.key === "ArrowDown" && index < filteredStudents.length - 1) {
            document.getElementById(`input-${index + 1}-${subject}`).focus();
        } else if (e.key === "ArrowUp" && index > 0) {
            document.getElementById(`input-${index - 1}-${subject}`).focus();
        }
    };

    const saveDataToDatabase = () => {
        if (!selectedSchool) {
            alert('Please select a school first.');
            return;
        }

        alert('Data is saving to the database...');
        axios
            .put(`https://marks-81ffd-default-rtdb.firebaseio.com/2024/SA-1/schools/${selectedSchool}/UKG.json`, students)
            .then(() => alert('Data saved successfully!'))
            .catch(error => console.error('Error saving data:', error));
    };

    const saveToExcel = () => {
        const XLSX = window.XLSX;
        const wb = XLSX.utils.book_new();
    
        const headers = [
            "Sno", "Student Name", "Pen Number", "Section", "Telugu", "English", "Mathematics", "EVS", "Colouring", "Rhymes", 
            "Grand Total", "Total Grade", "GPA", "Percentage"
        ];
    
        const rows = students.map((student, index) => ([
            index + 1,                        
            student.studentName || '',        
            student.penNumber || '',          
            student.section || '',            
            student.telugu || '',             
            student.english || '',            
            student.mathematics || '',        
            student.evs || '',                
            student.colouring || '',          
            student.rhymes || '',             
            student.grandTotal || '',         
            student.totalGrade || '',         
            student.gpa || '',                
            student.percentage || ''          
        ]));
    
        const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
        XLSX.utils.book_append_sheet(wb, ws, 'Students Marks');
        XLSX.writeFile(wb, 'Students_Marks.xlsx');
    };
    
    return (
        <div>
            <h1>Student Marks Entry</h1>
            <select value={selectedSchool} onChange={e => setSelectedSchool(e.target.value)}>
                <option value="">Select School</option>
                {schools.map(school => (
                    <option key={school.name} value={school.name}>{school.name}</option>
                ))}
            </select>

            {selectedSchool && (
                <div>
                    <h2>Selected School: {selectedSchool}</h2>
                    <button onClick={saveDataToDatabase}>Save Data</button>
                    <button onClick={saveToExcel}>Download in Excel</button>
                    <table border="1">
                        <thead>
                            <tr>
                                <th>Sno</th>
                                <th>Student Name</th>
                                <th>Pen Number</th>
                                <th>Section</th>
                                <th>Telugu</th>
                                <th>English</th>
                                <th>Mathematics</th>
                                <th>EVS</th>
                                <th>Colouring</th>
                                <th>Rhymes</th>
                                <th>Grand Total</th>
                                <th>Total Grade</th>
                                <th>GPA</th>
                                <th>Percentage</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredStudents.map((student, index) => (
                                <tr key={student.sno}>
                                    <td>{student.sno}</td>
                                    <td>{student.studentName}</td>
                                    <td>{student.penNumber}</td>
                                    <td>{student.section}</td>
                                    {["telugu", "english", "mathematics", "evs", "rhymes", "colouring"].map(subject => (
                                        <td key={subject}>
                                            <input
                                                type="text"
                                                id={`input-${index}-${subject}`}
                                                value={student[subject][0]}
                                                onChange={e => handleInputChange(index, subject, e.target.value)}
                                                onKeyDown={e => handleKeyDown(e, index, subject)}
                                                style={{ width: '30px' }}
                                            />
                                        </td>
                                    ))}
                                    <td>{student.grandTotal}</td>
                                    <td>{student.totalGrade}</td>
                                    <td>{student.gpa}</td>
                                    <td>{student.percentage}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}

// Rendering
const root = createRoot(document.getElementById('root'));
root.render(<StudentMarksEntry />);
