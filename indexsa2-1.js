const { useState, useEffect } = React;
const { createRoot } = ReactDOM;

// Sample school data
const schools = [
    { name: 'Talaricheruvu' },
    { name: 'Boyareddypalli' },
    { name: 'Mantapampalli' },
    { name: 'ALL' } // Placeholder for combined data
];

// Maximum marks for each sub-column
const maxMarks = [30, 70]; // Updated to match the allowed marks for FA1-30M, SA1-70M

// Calculate totals, grades, and SGPA
const calculateTotal = marks => marks.slice(0, 2).reduce((a, b) => a + Number(b), 0); // Updated to calculate total for the first 2 fields

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

const calculateSGPA = subTotal => (subTotal / 100 * 10).toFixed(1); // Updated for total max marks of 100 per subject
const calculateTotalGrade = grandTotal => {
    if (grandTotal >= 460) return 'A1';
    if (grandTotal >= 410) return 'A2';
    if (grandTotal >= 360) return 'B1';
    if (grandTotal >= 310) return 'B2';
    if (grandTotal >= 260) return 'C1';
    if (grandTotal >= 210) return 'C2';
    if (grandTotal >= 180) return 'D1';
    return 'D2';
};

const calculateGPA = grandTotal => (grandTotal / 500 * 10).toFixed(1); // Assuming total max marks of 500 across 5 subjects
const calculatePercentage = grandTotal => ((grandTotal / 500) * 100).toFixed(1); // Assuming total max marks of 500

// React component
function StudentMarksEntry() {
    const [selectedSchool, setSelectedSchool] = useState('');
    const [students, setStudents] = useState([]);
    const [filteredStudents, setFilteredStudents] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        const fetchSchoolDataFromFirebase = async (school) => {
            const response = await axios.get(`https://marksentry2024-default-rtdb.firebaseio.com/2024/SA-2/schools/${school}/Class-1.json`);
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
        const maxValue = maxMarks[subIndex];
    
        if (subIndex === 0) {
            if (!/^\d*$/.test(value)) {
                alert('Please enter only numbers for Activity.');
                return;
            }
            const numericValue = value === '' ? '' : Number(value);
            if (numericValue < 0 || numericValue > maxValue) {
                alert(`Enter the marks according to the limit. Maximum allowed is ${maxValue}`);
                return;
            }
            student[subject][subIndex] = numericValue;
        } else if (subIndex === 1) {
            if (value === 'A' || value === '' || !isNaN(value)) {
                const numericValue = value === '' ? '' : Number(value);
                if (!isNaN(numericValue) && (numericValue < 0 || numericValue > maxValue)) {
                    alert(`Enter the marks according to the limit. Maximum allowed is ${maxValue}`);
                    return;
                }
                student[subject][subIndex] = numericValue || value; // Allow "A" or any valid number including 0
            } else {
                alert('Please enter only numbers or "A" for SA1-70M.');
                return;
            }
        }
    
        student[subject][2] = calculateTotal(student[subject].map(val => isNaN(val) || val === '' ? 0 : Number(val)));
        student[subject][3] = calculateSGGrade(student[subject][2]);
        student[subject][4] = calculateSGPA(student[subject][2]);
    
        student.grandTotal = student.telugu[2] + student.hindi[2] + student.english[2] + student.mathematics[2] + student.social[2];
        student.totalGrade = calculateTotalGrade(student.grandTotal);
        student.gpa = calculateGPA(student.grandTotal);
        student.percentage = calculatePercentage(student.grandTotal);
    
        setStudents(newStudents);
        setFilteredStudents(newStudents);
    };
    
    const handleKeyDown = (e, index, subject, subIndex) => {
      
        const rowCount = students.length; 
        const subjectList = ['telugu', 'hindi', 'english', 'mathematics', 'social'];
        const subjectCount = subjectList.length;
        const columnCount = 2; // FA1-30M and SA1-70M
    
        let [newIndex, newSubIndex] = [index, subIndex];
        let newSubject = subject;
    
        if (e.key.startsWith("Arrow")) {
            e.preventDefault(); // Prevent the default behavior (i.e., moving the cursor in the input field)
    
            // Handling vertical navigation (Up and Down)
            if (e.key === "ArrowUp" && newIndex > 0) {
                newIndex--; // Move to the row above
            } else if (e.key === "ArrowDown" && newIndex < rowCount - 1) {
                newIndex++; // Move to the row below
            }
    
            // Handling horizontal navigation (Left and Right)
            if (e.key === "ArrowLeft") {
                if (newSubIndex > 0) {
                    newSubIndex--; // Move left within the same subject
                } else {
                    const currentSubjectIndex = subjectList.indexOf(subject);
                    if (currentSubjectIndex > 0) {
                        newSubject = subjectList[currentSubjectIndex - 1]; // Move to the previous subject
                        newSubIndex = columnCount - 1; // Move to the last sub-column of the previous subject
                    }
                }
            } else if (e.key === "ArrowRight") {
                if (newSubIndex < columnCount - 1) {
                    newSubIndex++; // Move right within the same subject
                } else {
                    const currentSubjectIndex = subjectList.indexOf(subject);
                    if (currentSubjectIndex < subjectCount - 1) {
                        newSubject = subjectList[currentSubjectIndex + 1]; // Move to the next subject
                        newSubIndex = 0; // Move to the first sub-column of the next subject
                    }
                }
            }
    
            // Move focus to the new input field
            const newInputId = `input-${newIndex}-${newSubject}-${newSubIndex}`;
            const newInput = document.getElementById(newInputId);
            if (newInput) {
                newInput.focus();
            }
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
            .put(`https://marksentry2024-default-rtdb.firebaseio.com/2024/SA-2/schools/${selectedSchool}/Class-1.json`, students)
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
    
        // Define headers for the Excel sheet
        const headers1 = [
            "Sno", "Student Name", "Pen Number", "Section",
            "Telugu", "", "", "", "",
            "Hindi", "", "", "", "",
            "English", "", "", "", "",
            "Mathematics", "", "", "", "",
            "Social", "", "", "", "",
            "Grand Total", "Total Grade", "GPA", "Percentage"
        ];
    
        const headers2 = [
            "", "", "", "",
            "FA2-30M", "SA2-70M", "Total", "Grade", "SGPA",
            "FA2-30M", "SA2-70M", "Total", "Grade", "SGPA",
            "FA2-30M", "SA2-70M", "Total", "Grade", "SGPA",
            "FA2-30M", "SA2-70M", "Total", "Grade", "SGPA",
            "FA2-30M", "SA2-70M", "Total", "Grade", "SGPA",
            "", "", "", ""
        ];
    
        // Prepare data rows
        const rows = students.map((student, index) => ([
            index + 1, // Sno
            student.studentName, // Student Name
            student.penNumber, // Pen Number
            student.section, // Section
    
            // Telugu Marks
            student.telugu[0],  // FA1-30M
            student.telugu[1],  // SA1-70M
            student.telugu[2],  // Total
            student.telugu[3],  // Grade
            student.telugu[4],  // SGPA
    
            // Hindi Marks
            student.hindi[0],
            student.hindi[1],
            student.hindi[2],
            student.hindi[3],
            student.hindi[4],
    
            // English Marks
            student.english[0],
            student.english[1],
            student.english[2],
            student.english[3],
            student.english[4],
    
            // Mathematics Marks
            student.mathematics[0],
            student.mathematics[1],
            student.mathematics[2],
            student.mathematics[3],
            student.mathematics[4],
    
            // Social Marks
            student.social[0],
            student.social[1],
            student.social[2],
            student.social[3],
            student.social[4],
    
            // Other totals and grades
            student.grandTotal, // Grand Total
            student.totalGrade, // Total Grade
            student.gpa,        // GPA
            student.percentage  // Percentage
        ]));
    
        // Create the worksheet from the headers and rows
        const ws = XLSX.utils.aoa_to_sheet([headers1, headers2, ...rows]);
        XLSX.utils.book_append_sheet(wb, ws, 'Students Marks');
    
        // Save the workbook to an Excel file
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
                                <th colSpan="5">Telugu</th>
                                <th colSpan="5">Hindi</th>
                                <th colSpan="5">English</th>
                                <th colSpan="5">Mathematics</th>
                                <th colSpan="5">EVS</th>
                                <th rowSpan="2">Grand Total</th>
                                <th rowSpan="2">Total Grade</th>
                                <th rowSpan="2">GPA</th>
                                <th rowSpan="2">Percentage</th>
                            </tr>
                            <tr>
                                {["Telugu", "Hindi", "English", "Mathematics", "EVS"].map(subject => (
                                    <React.Fragment key={subject}>
                                        <th>Activity</th>
                                        <th>SA2-70M</th>
                                        <th>Total</th>
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
                                    {["telugu", "hindi", "english", "mathematics", "social"].map(subject => (
                                        <React.Fragment key={subject}>
                                            {student[subject].slice(0, 2).map((mark, subIndex) => (
                                                <td key={subIndex}>
                                                    <input
                                                        id={`input-${index}-${subject}-${subIndex}`} 
                                                        type="text" 
                                                        value={mark === 0 ? '' : mark}
                                                        onChange={e => handleInputChange(index, subject, subIndex, e.target.value)}
                                                        onKeyDown={e => handleKeyDown(e, index, subject, subIndex)} 
                                                        style={{ width: '30px' }} 
                                                    />
                                                </td>
                                            ))}
                                            <td>{student[subject][2]}</td>
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

// Rendering
const root = createRoot(document.getElementById('root'));
root.render(<StudentMarksEntry />);
