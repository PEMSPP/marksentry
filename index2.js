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

const calculateGrade = total => {
    if (total <= 9) return 'D';
    if (total <= 19) return 'C';
    if (total <= 29) return 'B2';
    if (total <= 39) return 'B1';
    if (total <= 45) return 'A2';
    return 'A1';
};

const calculateSGPA = subTotal => (subTotal / 50 * 10).toFixed(1); // Assuming total max marks of 50

const calculateGPA = grandTotal => (grandTotal / 250 * 10).toFixed(1); // Updated assuming total max marks of 250

const calculatePercentage = grandTotal => ((grandTotal / 250) * 100).toFixed(1); // Updated assuming total max marks of 250

// React component
function StudentMarksEntry() {
    const [selectedSchool, setSelectedSchool] = useState('');
    const [students, setStudents] = useState([]);
    const [savedData, setSavedData] = useState({});

    useEffect(() => {
        const fetchSchoolData = async (school) => {
            const response = await fetch('studentsData2.json');
            const data = await response.json();
            const schoolData = data[school] || [];
            return schoolData.map((student, index) => ({
                ...student,
                sno: index + 1,
                section: student.section, // Fetch section from the data
                telugu: ['', '', '', '', '', '', '', 0, '', 0],
                hindi: ['', '', '', '', '', '', '', 0, '', 0],
                english: ['', '', '', '', '', '', '', 0, '', 0],
                mathematics: ['', '', '', '', '', '', '', 0, '', 0],
                social: ['', '', '', '', '', '', '', 0, '', 0], // Updated Subjects
                subject: ['FA1-20M', 'Speaking', 'Basic Knowledge', 'Writing', 'Corrections', 'Behaviour', 'Activity', 'SubTotal', 'Grade', 'SGPA'],
                grandTotal: 0,
                totalGrade: '',
                gpa: 0,
                percentage: 0
            }));
        };

        const fetchAllData = async () => {
              const allData = [];
            let snoCounter = 1; // Initialize SNO counter
            for (const school of schools.slice(0, -1)) {
                const schoolData = await fetchSchoolData(school.name);
                schoolData.forEach(student => {
                    student.sno = snoCounter++; // Assign continuous SNO
                    allData.push(student);
                });
            }
            setStudents(allData);
        };

        if (selectedSchool) {
            if (selectedSchool === 'ALL') {
                fetchAllData();
            } else {
                fetchSchoolData(selectedSchool).then(setStudents);
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
        student[subject][8] = calculateGrade(student[subject][7]);
        student[subject][9] = calculateSGPA(student[subject][7]);
    
        student.grandTotal = student.telugu[7] + student.hindi[7] + student.english[7] + student.mathematics[7] + student.social[7];
        student.totalGrade = calculateGrade(student.grandTotal);
        student.gpa = calculateGPA(student.grandTotal);
        student.percentage = calculatePercentage(student.grandTotal);
    
        // Update state with the new students array
        setStudents(newStudents);
    };

    const saveDataToDatabase = async () => {
        const schoolName = selectedSchool; // Save under the selected school name

        if (window.confirm("Data is saving to database. Do you want to continue?")) {
            for (const student of students) {
                const penNumber = student.penNumber; // Unique identifier for each student
        
                try {
                    // Check if student data already exists to prevent duplicates
                    const response = await axios.get(`https://marksentry-bcdd1-default-rtdb.firebaseio.com/Class-2${schoolName}/${penNumber}.json`);
        
                    if (response.data) {
                        // Student data already exists, update the record
                        await axios.put(`https://marksentry-bcdd1-default-rtdb.firebaseio.com/Class-2${schoolName}/${penNumber}.json`, student);
                    } else {
                        // Student data does not exist, create a new record
                        await axios.post(`https://marksentry-bcdd1-default-rtdb.firebaseio.com/Class-2${schoolName}.json`, { [penNumber]: student });
                    }
                } catch (error) {
                    console.error('Error saving data:', error);
                }
            }
            alert("Data saved successfully to the database.");
        }
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
    
        // Merge cells for the first header row where applicable
        const mergeRanges = [
            { s: { r: 0, c: 4 }, e: { r: 0, c: 13 } }, // Telugu: 10 columns (4-13)
            { s: { r: 0, c: 14 }, e: { r: 0, c: 23 } }, // Hindi: 10 columns (14-23)
            { s: { r: 0, c: 24 }, e: { r: 0, c: 33 } }, // English: 10 columns (24-33)
            { s: { r: 0, c: 34 }, e: { r: 0, c: 43 } }, // Mathematics: 10 columns (34-43)
            { s: { r: 0, c: 44 }, e: { r: 0, c: 53 } }  // Social: 10 columns (44-53)
        ];
    
        if (!ws['!merges']) ws['!merges'] = [];
        ws['!merges'].push(...mergeRanges);
    
        XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
    
        // Save to Excel file
        XLSX.writeFile(wb, "students_marks.xlsx");
    };
    
    return (
        <div>
            <div>
                <label htmlFor="school">Select School:</label>
                <select id="school" value={selectedSchool} onChange={e => setSelectedSchool(e.target.value)}>
                    <option value="">Select a school</option>
                    {schools.map((school, index) => (
                        <option key={index} value={school.name}>{school.name}</option>
                    ))}
                </select>
            </div>

            {students.length > 0 && (
                <table border={1}>
                    <thead>
                        <tr>
                            <th rowSpan={2}>Sno</th>
                            <th rowSpan={2}>Student Name</th>
                            <th rowSpan={2}>Pen Number</th>
                            <th rowSpan={2}>Section</th>
                            <th colSpan={10}>Telugu</th>
                            <th colSpan={10}>Hindi</th>
                            <th colSpan={10}>English</th>
                            <th colSpan={10}>Mathematics</th>
                            <th colSpan={10}>EVS</th>
                            <th rowSpan={2}>Grand Total</th>
                            <th rowSpan={2}>Total Grade</th>
                            <th rowSpan={2}>GPA</th>
                            <th rowSpan={2}>Percentage</th>
                        </tr>
                        <tr>
                            <th>FA1-20M</th>
                            <th>Speaking</th>
                            <th>Basic Knowledge</th>
                            <th>Writing</th>
                            <th>Corrections</th>
                            <th>Behaviour</th>
                            <th>Activity</th>
                            <th>SubTotal</th>
                            <th>Grade</th>
                            <th>SGPA</th>
                            <th>FA1-20M</th>
                            <th>Speaking</th>
                            <th>Basic Knowledge</th>
                            <th>Writing</th>
                            <th>Corrections</th>
                            <th>Behaviour</th>
                            <th>Activity</th>
                            <th>SubTotal</th>
                            <th>Grade</th>
                            <th>SGPA</th>
                            <th>FA1-20M</th>
                            <th>Speaking</th>
                            <th>Basic Knowledge</th>
                            <th>Writing</th>
                            <th>Corrections</th>
                            <th>Behaviour</th>
                            <th>Activity</th>
                            <th>SubTotal</th>
                            <th>Grade</th>
                            <th>SGPA</th>
                            <th>FA1-20M</th>
                            <th>Speaking</th>
                            <th>Basic Knowledge</th>
                            <th>Writing</th>
                            <th>Corrections</th>
                            <th>Behaviour</th>
                            <th>Activity</th>
                            <th>SubTotal</th>
                            <th>Grade</th>
                            <th>SGPA</th>
                            <th>FA1-20M</th>
                            <th>Speaking</th>
                            <th>Basic Knowledge</th>
                            <th>Writing</th>
                            <th>Corrections</th>
                            <th>Behaviour</th>
                            <th>Activity</th>
                            <th>SubTotal</th>
                            <th>Grade</th>
                            <th>SGPA</th>
                        </tr>
                    </thead>
                    <tbody>
                        {students.map((student, index) => (
                            <tr key={index}>
                                <td>{student.sno}</td>
                                <td>{student.studentName}</td>
                                <td>{student.penNumber}</td>
                                <td>{student.section}</td>
                                {['telugu', 'hindi', 'english', 'mathematics', 'social'].map(subject =>
                                    student[subject].map((mark, subIndex) => (
                                        <td key={subIndex}>
                                            {subIndex < 7 ? (
                                                <input
                                                    type="number"
                                                    value={mark}
                                                    onChange={e =>
                                                        handleInputChange(index, subject, subIndex, e.target.value)
                                                    }
                                                />
                                            ) : (
                                                mark
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
            )}
            {students.length > 0 && (
                <div>
                    <button onClick={saveToExcel}>Save to Excel</button>
                    <button onClick={saveDataToDatabase}>Save to Database</button>
                </div>
            )}
        </div>
    );
}

// Render the component
const root = createRoot(document.getElementById('root'));
root.render(<StudentMarksEntry />);
