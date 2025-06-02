const { useState, useEffect } = React;
const { createRoot } = ReactDOM;

const schools = [
    { name: 'Talaricheruvu' },
    { name: 'Boyareddypalli' },
    { name: 'Mantapampalli' },
    { name: 'Ganesh Pahad' },
    { name: 'Tandur' },
    { name: 'ALL' }
];

// Maximum marks for each sub-column (updated for PScience & NScience)
const maxMarks = {
    default: [100],  // Default: FA1-30M (20), SA1-80M (80)
    pscience: [50], // PScience: FA1-30M (10), SA1-80M (40)
    nscience: [50]  // NScience: FA1-30M (10), SA1-80M (40)
};

const calculateTotal = marks => marks.slice(0, 2).reduce((a, b) => a + Number(b), 0);

const calculateSGGrade = total => {
    if (total >= 91) return 'A1';
    if (total >= 81) return 'A2';
    if (total >= 71) return 'B1';
    if (total >= 61) return 'B2';
    if (total >= 51) return 'C1';
    if (total >= 41) return 'C2';
    if (total >= 31) return 'D1';
    return 'D2';
};
const calculateSGGrade50 = total => {
    if (total >= 46) return 'A1';
    if (total >= 41) return 'A2';
    if (total >= 36) return 'B1';
    if (total >= 31) return 'B2';
    if (total >= 26) return 'C1';
    if (total >= 21) return 'C2';
    if (total >= 16) return 'D1';
    return 'D2';
};

const calculateSGPA50 = subTotal => (subTotal / 50 * 10).toFixed(1);

const calculateSGPA = subTotal => (subTotal / 100 * 10).toFixed(1);

const calculateTotalGrade = grandTotal => {
    if (grandTotal >= 540) return 'A1';
    if (grandTotal >= 480) return 'A2';
    if (grandTotal >= 420) return 'B1';
    if (grandTotal >= 360) return 'B2';
    if (grandTotal >= 300) return 'C1';
    if (grandTotal >= 240) return 'C2';
    if (grandTotal >= 180) return 'D1';
    return 'D2';
};

const calculateGPA = grandTotal => (grandTotal / 600 * 10).toFixed(1);
const calculatePercentage = grandTotal => ((grandTotal / 600) * 100).toFixed(1);

function StudentMarksEntry() {
    const [selectedSchool, setSelectedSchool] = useState('');
    const [students, setStudents] = useState([]);
    const [filteredStudents, setFilteredStudents] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');

    
    useEffect(() => {
        const fetchSchoolDataFromFirebase = async (school) => {
            const response = await axios.get(`https://marksentry2024-default-rtdb.firebaseio.com/2024/SA-1/schools/${school}/Class-10.json`);
            const data = response.data || [];
            return Object.keys(data).map((key, index) => ({
                sno: index + 1,
                studentName: data[key].studentName,
                penNumber: data[key].penNumber,
                section: data[key].section,
                telugu: data[key].telugu || ['', '', 0, '', 0],
                hindi: data[key].hindi || ['', '', 0, '', 0],
                english: data[key].english || ['', '', 0, '', 0],
                mathematics: data[key].mathematics || ['', '', 0, '', 0],
                pscience: data[key].pscience || ['', '', 0, '', 0],
                nscience: data[key].nscience || ['', '', 0, '', 0],
                social: data[key].social || ['', '', 0, '', 0],
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
    const handleInputChange = (index, subject, subIndex, value) => {
        const newStudents = [...students];
        const student = newStudents[index];
    
        if (subIndex === 1) {  // Only SA1 column is editable
            if (value === 'A' || value === '' || !isNaN(value)) {
                const numericValue = value === '' ? '' : Number(value);
                
                // Set max marks dynamically
                const maxMark = subject === 'pscience' || subject === 'nscience' ? 50 : 100;
    
                if (!isNaN(numericValue) && (numericValue < 0 || numericValue > maxMark)) {
                    alert(`Enter marks within limit (Max: ${maxMark})`);
                    return;
                }
                
                student[subject][subIndex] = numericValue || value;
            } else {
                alert('Please enter only numbers or "A".');
                return;
            }
        }
    
        // Total marks for subject = SA1-XXM (XX depends on subject)
        student[subject][2] = student[subject][1] === '' || isNaN(student[subject][1]) ? 0 : Number(student[subject][1]);
    
        // Apply subject-specific grading and SGPA logic
        if (subject === 'pscience' || subject === 'nscience') {
            student[subject][3] = calculateSGGrade50(student[subject][2]); // New grading function
            student[subject][4] = calculateSGPA50(student[subject][2]);  // New SGPA function
        } else {
            student[subject][3] = calculateSGGrade(student[subject][2]);
            student[subject][4] = calculateSGPA(student[subject][2]);
        }
    
        // Overall calculations
        student.grandTotal =
            student.telugu[2] +
            student.hindi[2] +
            student.english[2] +
            student.mathematics[2] +
            student.pscience[2] +
            student.nscience[2] +
            student.social[2];
    
        student.totalGrade = calculateTotalGrade(student.grandTotal);
        student.gpa = calculateGPA(student.grandTotal);
        student.percentage = calculatePercentage(student.grandTotal);
    
        setStudents(newStudents);
        setFilteredStudents(newStudents);
    };
    
    
    

    
    const handleKeyDown = (e, index, subject, subIndex) => {
        const rowCount = students.length; 
        const subjectList = ['telugu', 'hindi', 'english', 'mathematics', 'pscience', 'nscience', 'social'];
        const subjectCount = subjectList.length;
        const columnCount = 2; // FA1-30M and SA1-80M
    
        let newIndex = index;
        let newSubIndex = subIndex;
        let newSubject = subject;
    
        if (e.key.startsWith("Arrow")) {
            e.preventDefault(); // Prevent default cursor movement
    
            if (e.key === "ArrowUp" && newIndex > 0) {
                newIndex--; // Move to the row above
            } else if (e.key === "ArrowDown" && newIndex < rowCount - 1) {
                newIndex++; // Move to the row below
            }
    
            if (e.key === "ArrowLeft") {
                if (newSubIndex > 0) {
                    newSubIndex--; // Move left within the same subject
                } else {
                    const currentSubjectIndex = subjectList.indexOf(subject);
                    if (currentSubjectIndex > 0) {
                        newSubject = subjectList[currentSubjectIndex - 1]; 
                        newSubIndex = columnCount - 1; 
                    }
                }
            } else if (e.key === "ArrowRight") {
                if (newSubIndex < columnCount - 1) {
                    newSubIndex++; // Move right within the same subject
                } else {
                    const currentSubjectIndex = subjectList.indexOf(subject);
                    if (currentSubjectIndex < subjectCount - 1) {
                        newSubject = subjectList[currentSubjectIndex + 1];
                        newSubIndex = 0; 
                    }
                }
            }
    
            // Generate the correct input field ID and move focus
            const newInputId = `input-${newIndex}-${newSubject}-${newSubIndex}`;
            setTimeout(() => {
                const newInput = document.getElementById(newInputId);
                if (newInput) {
                    newInput.focus();
                    newInput.select(); // Select text for easy editing
                }
            }, 0);
        }
    };
    
    const saveDataToDatabase = () => {
        if (!selectedSchool) {
            alert('Please select a school first.');
            return;
        }

        // Notify the user that data is being saved
        alert('Data is saving to the database...');

        axios
            .put(`https://marksentry2024-default-rtdb.firebaseio.com/2024/SA-1/schools/${selectedSchool}/Class-10.json`, students)
            .then(() => {
                // Notify the user that data is saved successfully
                alert('Data saved successfully!');
            })
            .catch((error) => {
                console.error('Error saving data:', error);
                alert('Error saving data. Please try again.');
            });
    };
    // New functionality: Search students by name, pen number, or SNO
    const handleSearchChange = (e) => {
        const value = e.target.value;
        const regex = /^[a-zA-Z]+$|^\d+$/; // Allow only alphabets or only numbers, no alphanumeric

        if (value === '' || regex.test(value)) {
            setSearchQuery(value);
        }
    };

    const handleSearch = () => {
        if (!searchQuery) {
            setFilteredStudents(students); // Reset to all students if no search query
        } else {
            const searchResult = students.filter(student =>
                student.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                student.penNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
                student.sno.toString().includes(searchQuery)
            );
            setFilteredStudents(searchResult);
        }
    };

    const handleSearchKeyDown = (e) => {
        if (e.key === 'Enter') {
            handleSearch();
        }
    };
    
    const saveToExcel = () => {
        const XLSX = window.XLSX;
        const wb = XLSX.utils.book_new();
    
        // Define the first row headers (merged row)
        const headers1 = [
            "Sno", "Student Name", "Pen Number", "Section",
            "Telugu", "", "",
            "Hindi", "", "",
            "English", "", "",
            "Mathematics", "", "",
            "P.Science", "", "",
            "N.Science", "", "",
            "Social", "", "",
            "Grand Total", "Total Grade", "GPA", "Percentage"
        ];
    
        // Define the second row headers (subject-specific columns)
        const headers2 = [
            "", "", "", "",
            "SA1 Marks", "Grade", "SGPA",
            "SA1 Marks", "Grade", "SGPA",
            "SA1 Marks", "Grade", "SGPA",
            "SA1 Marks", "Grade", "SGPA",
            "SA1 Marks", "Grade", "SGPA",
            "SA1 Marks", "Grade", "SGPA",
            "SA1 Marks", "Grade", "SGPA",
            "", "", "", ""
        ];
    
        // Prepare student data rows
        const rows = students.map((student, index) => ([
            index + 1,  // Sno
            student.studentName,
            student.penNumber,
            student.section,
    
            // Telugu
            student.telugu[1] === 0 ? "" : student.telugu[1], 
            student.telugu[3],
            student.telugu[4],
    
            // Hindi
            student.hindi[1] === 0 ? "" : student.hindi[1],
            student.hindi[3],
            student.hindi[4],
    
            // English
            student.english[1] === 0 ? "" : student.english[1],
            student.english[3],
            student.english[4],
    
            // Mathematics
            student.mathematics[1] === 0 ? "" : student.mathematics[1],
            student.mathematics[3],
            student.mathematics[4],
    
            // P.Science
            student.pscience[1] === 0 ? "" : student.pscience[1],
            student.pscience[3],
            student.pscience[4],
    
            // N.Science
            student.nscience[1] === 0 ? "" : student.nscience[1],
            student.nscience[3],
            student.nscience[4],
    
            // Social
            student.social[1] === 0 ? "" : student.social[1],
            student.social[3],
            student.social[4],
    
            // Final Totals
            student.grandTotal,
            student.totalGrade,
            student.gpa,
            student.percentage
        ]));
    
        // Create the worksheet and append the headers and data
        const ws = XLSX.utils.aoa_to_sheet([headers1, headers2, ...rows]);
        XLSX.utils.book_append_sheet(wb, ws, 'Student Marks');
    
        // Save the workbook as an Excel file
        XLSX.writeFile(wb, 'Student_Marks.xlsx');
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
                    <button onClick={saveToExcel}>Save to Excel</button>
                    <input
                        type="text"
                        placeholder="Search by Name, Pen Number, or SNO"
                        value={searchQuery}
                        onChange={handleSearchChange}
                        onKeyDown={handleSearchKeyDown}
                    />
                    <table border="1">
                       <thead>
    <tr>
        <th rowSpan="2">Sno</th>
        <th rowSpan="2">Student Name</th>
        <th rowSpan="2">Pen Number</th>
        <th rowSpan="2">Section</th>
        <th colSpan="3">Telugu</th>
        <th colSpan="3">Hindi</th>
        <th colSpan="3">English</th>
        <th colSpan="3">Mathematics</th>
        <th colSpan="3">P.Science</th>
        <th colSpan="3">N.Science</th>
        <th colSpan="3">Social</th>
        <th rowSpan="2">Grand Total</th>
        <th rowSpan="2">Total Grade</th>
        <th rowSpan="2">GPA</th>
        <th rowSpan="2">Percentage</th>
    </tr>
    <tr>
        {["Telugu", "Hindi", "English", "Mathematics", "P.Science", "N.Science", "Social"].map(subject => (
            <React.Fragment key={subject}>
                <th>SA1</th>
                <th>Grade</th>
                <th>SGPA</th>
            </React.Fragment>
        ))}
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
                <React.Fragment key={subject}>
                    <td>
                        <input
                            type="text"
                            id={`input-${index}-${subject}-1`} // SA1-80M field
                            value={student[subject][1] === 0 ? '' : student[subject][1]}
                            onChange={e => handleInputChange(index, subject, 1, e.target.value)}
                            onKeyDown={e => handleKeyDown(e, index, subject, 1)}
                            style={{ width: '40px' }}
                           disabled={selectedSchool === 'Talaricheruvu' || 'Boyareddypalli' || 'Mantapampalli' || 'Ganesh Pahad' || 'Tandur' || 'ALL' }
                                                    
                        />
                    </td>
                    <td>{student[subject][3]}</td>
                    <td>{student[subject][4]}</td>
                </React.Fragment>
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

const root = createRoot(document.getElementById('root'));
root.render(<StudentMarksEntry />);
