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

// Maximum marks for each sub-column
const maxMarks = [20, 5, 5, 5, 5, 5, 5];

// Calculate totals, grades, and SGPA
const calculateTotal = marks => marks.slice(0, 7).reduce((a, b) => a + Number(b), 0);

const calculateSGGrade = total => {
    if (total >= 46) return 'A1';
    if (total >= 41) return 'A2';
    if (total >= 36) return 'B1';
    if (total >= 31) return 'B2';
    if (total >= 26) return 'C1';
    if (total >= 21) return 'C2';
    if (total >= 18) return 'D1';
    return 'D2';
};
const calculateTotalGrade = grandTotal => {
    if (grandTotal >= 230) return 'A1';
    if (grandTotal >= 205) return 'A2';
    if (grandTotal >= 180) return 'B1';
    if (grandTotal >= 155) return 'B2';
    if (grandTotal >= 130) return 'C1';
    if (grandTotal >= 105) return 'C2';
    if (grandTotal >= 90) return 'D1';
    return 'D2';
};

const calculateSGPA = subTotal => (subTotal / 50 * 10).toFixed(1); // Assuming total max marks of 50
const calculateGPA = grandTotal => (grandTotal / 250 * 10).toFixed(1); // Updated assuming total max marks of 250
const calculatePercentage = grandTotal => ((grandTotal / 250) * 100).toFixed(1); // Updated assuming total max marks of 250

// React component
function StudentMarksEntry() {
    const [selectedSchool, setSelectedSchool] = useState('');
    const [students, setStudents] = useState([]);
    const [filteredStudents, setFilteredStudents] = useState([]); // State to hold filtered student data
    const [searchQuery, setSearchQuery] = useState(''); // Search query state

    useEffect(() => {
        const fetchSchoolDataFromFirebase = async (school) => {
            const response = await axios.get(`https://marksentry2024-default-rtdb.firebaseio.com/2024/FA-1/schools/${school}/Class-4.json`);
            const data = response.data || [];
            return Object.keys(data).map((key, index) => ({
                sno: index + 1,
                studentName: data[key].studentName,
                penNumber: data[key].penNumber,
                section: data[key].section,
                telugu: data[key].telugu || ['', '', '', '', '', '', '', 0, '', 0],
                hindi: data[key].hindi || ['', '', '', '', '', '', '', 0, '', 0],
                english: data[key].english || ['', '', '', '', '', '', '', 0, '', 0],
                mathematics: data[key].mathematics || ['', '', '', '', '', '', '', 0, '', 0],
                social: data[key].social || ['', '', '', '', '', '', '', 0, '', 0],
                grandTotal: data[key].grandTotal || 0,
                totalGrade: data[key].totalGrade || '',
                gpa: data[key].gpa || 0,
                percentage: data[key].percentage || 0
            }));
        };

        const fetchAllDataFromFirebase = async () => {
            const allData = [];
            let snoCounter = 1; // Initialize SNO counter
            for (const school of schools.slice(0, -1)) {
                const schoolData = await fetchSchoolDataFromFirebase(school.name);
                schoolData.forEach(student => {
                    student.sno = snoCounter++; // Assign continuous SNO
                    allData.push(student);
                });
            }
            setStudents(allData);
            setFilteredStudents(allData); // Set filtered students initially to all data
        };

        if (selectedSchool) {
            if (selectedSchool === 'ALL') {
                fetchAllDataFromFirebase();
            } else {
                fetchSchoolDataFromFirebase(selectedSchool).then(data => {
                    setStudents(data);
                    setFilteredStudents(data); // Set filtered students initially to all data
                });
            }
        }
    }, [selectedSchool]);

    const handleInputChange = (index, subject, subIndex, value) => {
        const newStudents = [...students];
        const student = newStudents[index];
        const maxValue = maxMarks[subIndex];

        // Validate the entered value
        if (value < 0 || value > maxValue) {
            alert(`Enter the marks according to Limit. Maximum allowed is ${maxValue}`);
            return;
        }

        // Update the value in the corresponding field
        student[subject][subIndex] = value;

        // Recalculate totals, grades, SGPA, etc.
        student[subject][7] = calculateTotal(student[subject]);
        student[subject][8] = calculateSGGrade(student[subject][7]); // Updated to calculate SG Grade
        student[subject][9] = calculateSGPA(student[subject][7]);

        student.grandTotal = student.telugu[7] + student.hindi[7] + student.english[7] + student.mathematics[7] + student.social[7];
        student.totalGrade = calculateTotalGrade(student.grandTotal); // Updated to calculate Total Grade
        student.gpa = calculateGPA(student.grandTotal);
        student.percentage = calculatePercentage(student.grandTotal);

        // Update state with the new students array
        setStudents(newStudents);
        setFilteredStudents(newStudents);
    };

    const handleKeyDown = (e, index, subject, subIndex) => {
        const rowCount = students.length;
        const colCount = ['telugu', 'hindi', 'english', 'mathematics', 'social'].length * 10; // 10 columns per subject

        if (e.key.startsWith("Arrow")) {
            e.preventDefault(); // Prevent the default behavior (i.e., modifying the input)

            let [newIndex, newSubIndex] = [index, subIndex];

            if (e.key === "ArrowUp" && newIndex > 0) {
                newIndex--;
            } else if (e.key === "ArrowDown" && newIndex < rowCount - 1) {
                newIndex++;
            } else if (e.key === "ArrowLeft" && newSubIndex > 0) {
                newSubIndex--;
            } else if (e.key === "ArrowRight" && newSubIndex < colCount - 1) {
                newSubIndex++;
            }

            // Move focus to the new input field
            const newInputId = `input-${newIndex}-${subject}-${newSubIndex}`;
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
            .put(`https://marksentry2024-default-rtdb.firebaseio.com/2024/FA-1/schools/${selectedSchool}/Class-4.json`, students)
            .then(() => {
                // Notify the user that data is saved successfully
                alert('Data saved successfully!');
            })
            .catch((error) => {
                console.error('Error saving data:', error);
                alert('Error saving data. Please try again.');
            });
    };
    const saveToExcel = () => {
        const XLSX = window.XLSX;
        const wb = XLSX.utils.book_new();
    
        // Define headers for the Excel sheet
        const headers1 = [
            "Sno", "Student Name", "Pen Number", "Section",
            "Telugu", "", "", "", "", "", "", "",
            "Hindi", "", "", "", "", "", "", "",
            "English", "", "", "", "", "", "", "",
            "Mathematics", "", "", "", "", "", "", "",
            "Social", "", "", "", "", "", "", "",
            "Grand Total", "Total Grade", "GPA", "Percentage"
        ];
    
        const headers2 = [
            "", "", "", "",
            "FA1-20M", "Speaking", "Basic Knowledge", "Writing", "Corrections", "Behaviour", "Activity", "SubTotal", "Grade", "SGPA",
            "FA1-20M", "Speaking", "Basic Knowledge", "Writing", "Corrections", "Behaviour", "Activity", "SubTotal", "Grade", "SGPA",
            "FA1-20M", "Speaking", "Basic Knowledge", "Writing", "Corrections", "Behaviour", "Activity", "SubTotal", "Grade", "SGPA",
            "FA1-20M", "Speaking", "Basic Knowledge", "Writing", "Corrections", "Behaviour", "Activity", "SubTotal", "Grade", "SGPA",
            "FA1-20M", "Speaking", "Basic Knowledge", "Writing", "Corrections", "Behaviour", "Activity", "SubTotal", "Grade", "SGPA",
            "", "", "", ""
        ];
    
        // Prepare data for the sheet
        const ws_data = [headers1, headers2];
    
        // Add student data if available, else add placeholder rows
        if (students.length > 0) {
            students.forEach(student => {
                ws_data.push([
                    student.sno, student.studentName, student.penNumber, student.section,
                    ...student.telugu,
                    ...student.hindi,
                    ...student.english,
                    ...student.mathematics,
                    ...student.social,
                    student.grandTotal, student.totalGrade, student.gpa, student.percentage
                ]);
            });
        } else {
            // Add placeholder data if no students are available
            ws_data.push(["No data available"]);
        }
    
        const ws = XLSX.utils.aoa_to_sheet(ws_data);
    
        // Merge header cells for the first row where applicable
        ws['!merges'] = [
            { s: { r: 0, c: 4 }, e: { r: 0, c: 13 } }, // Telugu: 8 columns (4-11)
            { s: { r: 0, c: 14 }, e: { r: 0, c: 23 } }, // Hindi: 8 columns (12-19)
            { s: { r: 0, c: 24 }, e: { r: 0, c: 33 } }, // English: 8 columns (20-27)
            { s: { r: 0, c: 34 }, e: { r: 0, c: 43 } }, // Mathematics: 8 columns (28-35)
            { s: { r: 0, c: 44 }, e: { r: 0, c: 53 } }, // Social: 8 columns (36-43)
            { s: { r: 0, c: 54 }, e: { r: 0, c: 57 } }  // Grand Total, Grade, GPA, Percentage: 4 columns (44-47)
        ];
    
        // Add the sheet to the workbook
        XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
    
        // Save to Excel file
        XLSX.writeFile(wb, "students_marks.xlsx");
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

                    {/* Search Bar */}
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
                                <th colSpan="10">Telugu</th>
                                <th colSpan="10">Hindi</th>
                                <th colSpan="10">English</th>
                                <th colSpan="10">Mathematics</th>
                                <th colSpan="10">EVS</th>
                                <th rowSpan="2">Grand Total</th>
                                <th rowSpan="2">Total Grade</th>
                                <th rowSpan="2">GPA</th>
                                <th rowSpan="2">Percentage</th>
                            </tr>
                            <tr>
                                {["Telugu", "Hindi", "English", "Mathematics", "Social"].flatMap(subject =>
                                    ["FA2-20M", "Speaking", "Basic Knowledge", "Writing", "Corrections", "Behaviour", "Activity", "SubTotal", "Grade", "SGPA"]
                                        .map((sub, i) => <th key={`${subject}-${sub}`}>{sub}</th>)
                                )}
                            </tr>
                        </thead>
                        <tbody>
                            {filteredStudents.map((student, index) => (
                                <tr key={index}>
                                    <td>{student.sno}</td>
                                    <td>{student.studentName}</td>
                                    <td>{student.penNumber}</td>
                                    <td>{student.section}</td>
                                    {['telugu', 'hindi', 'english', 'mathematics', 'social'].flatMap(subject =>
                                        student[subject].map((value, subIndex) => (
                                            <td key={`${subject}-${subIndex}`}>
                                                {subIndex < 7 ? (
                                                    <input
                                                        id={`input-${index}-${subject}-${subIndex}`}
                                                        type="number"
                                                        value={value}
                                                        onChange={e => handleInputChange(index, subject, subIndex, e.target.value)}
                                                        onKeyDown={e => handleKeyDown(e, index, subject, subIndex)}
                                                     disabled={selectedSchool === 'Talaricheruvu' || 'Boyareddypalli' || 'Mantapampalli' || 'Ganesh Pahad' || 'Tandur' || 'ALL' }
                                                    />
                                                ) : (
                                                    <span>{value}</span>
                                                )}
                                            </td>
                                        ))
                                    )}
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

            <button onClick={saveToExcel}>Save to Excel</button>
            <button onClick={saveDataToDatabase}>Save to Database</button>
        </div>
    ); 
}

const root = createRoot(document.getElementById('root'));
root.render(<StudentMarksEntry />);
