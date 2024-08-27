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

const calculateSubGrade = total => {
    if (total <= 10) return 'D';
    if (total <= 20) return 'C';
    if (total <= 30) return 'B2';
    if (total <= 40) return 'B1';
    if (total <= 45) return 'A2';
    return 'A1';
};

const calculateTotalGrade = grandTotal => {
    if (grandTotal <= 100) return 'D2';
    if (grandTotal <= 125) return 'D1';
    if (grandTotal <= 135) return 'C2';
    if (grandTotal <= 150) return 'C1';
    if (grandTotal <= 175) return 'B2';
    if (grandTotal <= 200) return 'B1';
    if (grandTotal <= 225) return 'A2';
    return 'A1';
};

const calculateSGPA = subTotal => (subTotal / 50 * 10).toFixed(1); // Assuming total max marks of 50

const calculateGPA = grandTotal => (grandTotal / 250 * 10).toFixed(1); // Updated assuming total max marks of 250

const calculatePercentage = grandTotal => ((grandTotal / 250) * 100).toFixed(1); // Updated assuming total max marks of 250

// React component
function StudentMarksEntry() {
    const [selectedSchool, setSelectedSchool] = useState('');
    const [students, setStudents] = useState([]);
    const [isEditable, setIsEditable] = useState(true);

    useEffect(() => {
        const fetchSchoolData = async (school) => {
            const response = await fetch('studentsData1.json');
            const data = await response.json();
            const schoolData = data[school] || [];
            return schoolData.map((student, index) => ({
                ...student,
                sno: index + 1,
                section: student.section, // Fetch section from the data
                telugu: Array(10).fill(''),
                hindi: Array(10).fill(''),
                english: Array(10).fill(''),
                mathematics: Array(10).fill(''),
                social: Array(10).fill(''),
                grandTotal: 0,
                totalGrade: '',
                gpa: 0,
                percentage: 0
            }));
        };

        const fetchAllData = async () => {
            const allData = [];
            let snoCounter = 1;
            for (const school of schools.slice(0, -1)) {
                const schoolData = await fetchSchoolData(school.name);
                schoolData.forEach(student => {
                    student.sno = snoCounter++;
                    allData.push(student);
                });
            }
            setStudents(allData);
        };

        if (selectedSchool) {
            const savedData = localStorage.getItem(`savedData_${selectedSchool}`);
            if (savedData) {
                setStudents(JSON.parse(savedData));
            } else {
                if (selectedSchool === 'ALL') {
                    fetchAllData();
                } else {
                    fetchSchoolData(selectedSchool).then(setStudents);
                }
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

        // Recalculate totals, sub-grade, SGPA, etc.
        student[subject][7] = calculateTotal(student[subject]);
        student[subject][8] = calculateSubGrade(student[subject][7]);
        student[subject][9] = calculateSGPA(student[subject][7]);

        student.grandTotal = ['telugu', 'hindi', 'english', 'mathematics', 'social'].reduce(
            (total, subject) => total + student[subject][7], 0
        );
        student.totalGrade = calculateTotalGrade(student.grandTotal);
        student.gpa = calculateGPA(student.grandTotal);
        student.percentage = calculatePercentage(student.grandTotal);

        // Update state and save data to local storage
        setStudents(newStudents);
        localStorage.setItem(`savedData_${selectedSchool}`, JSON.stringify(newStudents));
    };

    const saveToDatabase = async () => {
        const schoolName = selectedSchool;
    
        try {
            for (const student of students) {
                const sno = student.sno; // Unique identifier for each student within a school
                const studentDataPath = `https://marksentry-bcdd1-default-rtdb.firebaseio.com/FA1MARKS/CLASS-1/${schoolName}/${sno}.json`;
    
                // Check if student data already exists to prevent duplicates
                const response = await axios.get(studentDataPath);
    
                if (response.data) {
                    // Student data already exists, update the record
                    await axios.put(studentDataPath, student);
                } else {
                    // Student data does not exist, create a new record
                    await axios.post(`https://marksentry-bcdd1-default-rtdb.firebaseio.com/FA1MARKS/CLASS-1/${schoolName}.json`, { [sno]: student });
                }
            }
            alert('Data saved successfully');
        } catch (error) {
            console.error('Error saving data:', error);
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
            { s: { r: 0, c: 44 }, e: { r: 0, c: 53 } }, // Social: 10 columns (44-53)
        ];

        ws['!merges'] = mergeRanges;

        XLSX.utils.book_append_sheet(wb, ws, 'Student Marks');
        XLSX.writeFile(wb, `${selectedSchool || 'All_Schools'}_student_marks.xlsx`);
    };

    return (
        <div>
            <h1>Student Marks Entry</h1>
            <select value={selectedSchool} onChange={e => setSelectedSchool(e.target.value)}>
                <option value="">Select School</option>
                {schools.map((school, index) => (
                    <option key={index} value={school.name}>{school.name}</option>
                ))}
            </select>
            {selectedSchool && (
                <div>
                    <table>
                        <thead>
                            <tr>
                                <th rowSpan={2}>Sno</th>
                                <th rowSpan={2}>Student Name</th>
                                <th rowSpan={2}>Pen Number</th>
                                <th rowSpan={2}>Section</th>
                                {['Telugu', 'Hindi', 'English', 'Mathematics', 'Social'].map(subject => (
                                    <React.Fragment key={subject}>
                                        <th colSpan={10}>{subject}</th>
                                    </React.Fragment>
                                ))}
                                <th rowSpan={2}>Grand Total</th>
                                <th rowSpan={2}>Total Grade</th>
                                <th rowSpan={2}>GPA</th>
                                <th rowSpan={2}>Percentage</th>
                            </tr>
                            <tr>
                                {[...Array(5)].map((_, subjectIndex) => (
                                    <React.Fragment key={subjectIndex}>
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
                                    </React.Fragment>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {students.map((student, index) => (
                                <tr key={index}>
                                    <td>{student.sno}</td>
                                    <td>{student.studentName}</td>
                                    <td>{student.penNumber}</td>
                                    <td>{student.section}</td>
                                    {['telugu', 'hindi', 'english', 'mathematics', 'social'].map(subject => (
                                        <React.Fragment key={subject}>
                                            {student[subject].map((value, subIndex) => (
                                                <td key={subIndex}>
                                                    {subIndex === 8 || subIndex === 7 || subIndex === 9 ? (
                                                        value
                                                    ) : isEditable ? (
                                                        <input
                                                            type="number"
                                                            value={value}
                                                            onChange={(e) =>
                                                                handleInputChange(index, subject, subIndex, e.target.value)
                                                            }
                                                        />
                                                    ) : (
                                                        value
                                                    )}
                                                </td>
                                            ))}
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
                    <button onClick={saveToDatabase}>Save to Database</button>
                    <button onClick={saveToExcel}>Export to Excel</button>
                    <button onClick={() => setIsEditable(!isEditable)}>
                        {isEditable ? 'Disable Edit' : 'Enable Edit'}
                    </button>
                </div>
            )}
        </div>
    );
}

// Initialize React
createRoot(document.getElementById('root')).render(<StudentMarksEntry />);

