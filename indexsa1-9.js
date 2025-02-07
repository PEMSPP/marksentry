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
const specialMaxMarks = 50; // For Colouring and Rhymes only

// Grade calculation functions
const calculateTotalGrade = (grandTotal) => {
    if (grandTotal >= 540) return 'A1';
    if (grandTotal >= 480) return 'A2';
    if (grandTotal >= 420) return 'B1';
    if (grandTotal >= 360) return 'B2';
    if (grandTotal >= 300) return 'C1';
    if (grandTotal >= 240) return 'C2';
    if (grandTotal >= 180) return 'D1';
    return 'D2';
};


const calculateGPA = grandTotal => (grandTotal / 600 * 10).toFixed(1); // New total max marks of 650 with Social included
const calculatePercentage = grandTotal => ((grandTotal / 600) * 100).toFixed(1);

// React component
function StudentMarksEntry() {
    const [selectedSchool, setSelectedSchool] = useState('');
    const [students, setStudents] = useState([]);
    const [filteredStudents, setFilteredStudents] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        const fetchSchoolDataFromFirebase = async (school) => {
            const response = await axios.get(`https://marksentry2024-default-rtdb.firebaseio.com/2024/SA-1/schools/${school}/Class-9.json`);
            const data = response.data || [];
            return Object.keys(data).map((key, index) => ({
                sno: index + 1,
                studentName: data[key].studentName,
                penNumber: data[key].penNumber,
                section: data[key].section,
                telugu: data[key].telugu || [''],
                hindi: data[key].hindi || [''],
                english: data[key].english || [''],
                mathematics: data[key].mathematics || [''],// New social column
                pscience: data[key].pscience || [''],
                nscience: data[key].nscience || [''],
                social: data[key].social || [''], 
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
        const maxAllowed = (subject === 'pscience' || subject === 'nscience') ? specialMaxMarks : maxMarks;
        if (value === '' || value === 'A' || (!isNaN(value) && value >= 0 && value <= maxAllowed)) {
            student[subject][0] = value;
        } else {
            alert(`Please enter a valid number (0-${maxAllowed}) or "A" for absent.`);
            return;
        }

        // Update grand total, grade, GPA, and percentage based on the new values
        student.grandTotal = ["telugu", "hindi", "english", "mathematics", "pscience", "nscience", "social"].reduce((acc, subj) => {
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
        const subjectOrder = ["telugu", "hindi", "english", "mathematics", "pscience", "nscience", "social"];
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
            .put(`https://marksentry2024-default-rtdb.firebaseio.com/2024/SA-1/schools/${selectedSchool}/Class-10.json`, students)
            .then(() => alert('Data saved successfully!'))
            .catch(error => console.error('Error saving data:', error));
    };

    const saveToExcel = () => {
        const XLSX = window.XLSX;
        const wb = XLSX.utils.book_new();

        const headers = [
            "Sno", "Student Name", "Pen Number", "Section", "Telugu", "Hindi", "English", "Mathematics", "P.science", "N.science", "Social",
            "Grand Total", "Total Grade", "GPA", "Percentage"
        ];

        const rows = students.map((student, index) => ([
            index + 1,
            student.studentName || '',
            student.penNumber || '',
            student.section || '',
            student.telugu || '',
            student.hindi || '',
            student.english || '',
            student.mathematics || '',
            student.pscience || '',
            student.nscience || '',
            student.social || '',
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
                                <th>Hindi</th>
                                <th>English</th>
                                <th>Mathematics</th>
                                <th>P.Science</th>
                                <th>N.Science</th>
                                <th>Social</th>
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
                                    {["telugu", "hindi", "english", "mathematics", "pscience", "nscience", "social"].map(subject => (
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
