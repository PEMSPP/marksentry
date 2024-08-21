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

const calculateSGPA = subTotal => (subTotal / 50 * 10).toFixed(2); // Assuming total max marks of 50

const calculateGPA = grandTotal => (grandTotal / 250 * 10).toFixed(2); // Updated assuming total max marks of 250

const calculatePercentage = grandTotal => ((grandTotal / 250) * 100).toFixed(2); // Updated assuming total max marks of 250

// React component
function StudentMarksEntry() {
    const [selectedSchool, setSelectedSchool] = useState('');
    const [students, setStudents] = useState([]);
    const [isEditable, setIsEditable] = useState(true);
    const [isSaveEnabled, setIsSaveEnabled] = useState(false);
    const [savedData, setSavedData] = useState({});

    useEffect(() => {
        const fetchSchoolData = async (school) => {
            const response = await fetch('studentsData1.json');
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
            for (const school of schools.slice(0, -1)) { // Exclude 'ALL' from the iteration
                const schoolData = await fetchSchoolData(school.name);
                allData.push(...schoolData);
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
    
        // Update state and save data
        setStudents(newStudents);
    
        // Auto-save data without displaying a prompt
        saveData();
    
        // Check if all fields are filled to make the webpage static and display a prompt
        checkAndFinalizeTable();
    };
    
    const checkAndFinalizeTable = () => {
        const allFieldsFilled = students.every(student => 
            ['telugu', 'hindi', 'english', 'mathematics', 'social'].every(subject => 
                student[subject].slice(0, 7 ).every(mark => mark !== '' && mark !== null && mark !== undefined)
            )
        );
    
        if (allFieldsFilled) {
            alert('All data has been entered and saved. The webpage will now become static.');
            setIsEditable(false);
        }
    };
    
    const saveData = () => {
        axios.post('https://marksentry-bcdd1-default-rtdb.firebaseio.com/Class-1.json', students)
            .catch(error => console.error('Error saving data:', error));
    };

    const toggleEdit = () => {
        setIsEditable(true);
        setIsSaveEnabled(false);
    };

    const saveToExcel = () => {
        const XLSX = window.XLSX;
        const wb = XLSX.utils.book_new();
    
        // Define headers for the Excel sheet
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
    
        students.forEach(student => {
            ws_data.push([
                student.sno, student.studentName, student.penNumber, student.section,
                ...student.telugu,
                ...student.hindi,
                ...student.english,
                ...student.mathematics,
                ...student.science,
                ...student.social,
                student.grandTotal, student.totalGrade, student.gpa, student.percentage
            ]);
        });
    
        const ws = XLSX.utils.aoa_to_sheet(ws_data);
    
        // Merge cells for the first header row where applicable
        
            const mergeRanges = [
                { s: { r: 0, c: 4 }, e: { r: 0, c: 13 } }, // Telugu: 10 columns (4-13)
                { s: { r: 0, c: 14 }, e: { r: 0, c: 23 } }, // Hindi: 10 columns (14-23)
                { s: { r: 0, c: 24 }, e: { r: 0, c: 33 } }, // English: 10 columns (24-33)
                { s: { r: 0, c: 34 }, e: { r: 0, c: 43 } }, // Mathematics: 10 columns (34-43)
                { s: { r: 0, c: 44 }, e: { r: 0, c: 53 } },
             ] // Social: 10 columns (44-53)
            

            
            if (!ws['!merges']) ws['!merges'] = [];
            ws['!merges'].push(...mergeRanges);
            
        // Adjust column width for better readability (optional)
        ws['!cols'] = [
            { wpx: 50 },  // Sno
            { wpx: 150 }, // Student Name
            { wpx: 100 }, // Pen Number
            { wpx: 80 },  // Section
        
            { wpx: 80 }, { wpx: 80 }, { wpx: 80 }, { wpx: 80 }, { wpx: 80 }, { wpx: 80 }, { wpx: 80 }, { wpx: 80 }, // Telugu: 10 columns
            { wpx: 80 }, { wpx: 80 }, { wpx: 80 }, { wpx: 80 }, { wpx: 80 }, { wpx: 80 }, { wpx: 80 }, { wpx: 80 }, // Hindi: 10 columns
            { wpx: 80 }, { wpx: 80 }, { wpx: 80 }, { wpx: 80 }, { wpx: 80 }, { wpx: 80 }, { wpx: 80 }, { wpx: 80 }, // English: 10 columns
            { wpx: 80 }, { wpx: 80 }, { wpx: 80 }, { wpx: 80 }, { wpx: 80 }, { wpx: 80 }, { wpx: 80 }, { wpx: 80 }, // Mathematics: 10 columns
            { wpx: 80 }, { wpx: 80 }, { wpx: 80 }, { wpx: 80 }, { wpx: 80 }, { wpx: 80 }, { wpx: 80 }, { wpx: 80 }, // Social: 10 columns
        
            { wpx: 100 }, // Grand Total
            { wpx: 80 },  // Total Grade
            { wpx: 60 },  // GPA
            { wpx: 80 }   // Percentage
        ];
        // Append the worksheet and download the file
        XLSX.utils.book_append_sheet(wb, ws, "Student Marks");
        XLSX.writeFile(wb, "Student_Marks.xlsx");
    };

    return (
        <div>
            <header>
                <h1>Student Marks Entry</h1>
                <select
                    id="school-dropdown"
                    value={selectedSchool}
                    onChange={(e) => setSelectedSchool(e.target.value)}
                >
                    <option value="">Select School</option>
                    {schools.map(school => (
                        <option key={school.name} value={school.name}>
                            {school.name}
                        </option>
                    ))}
                </select>
            </header>
            {selectedSchool && (
                <main>
                    <button onClick={toggleEdit} disabled={isEditable}>Edit</button>
                    <button onClick={saveToExcel} disabled={!isSaveEnabled}>Save to Excel</button>
                    <table id="marks-table">
                        <thead>
                            <tr>
                                <th rowSpan="2">Sno</th>
                                <th rowSpan="2">Student Name</th>
                                <th rowSpan="2">Pen Number</th>
                                <th rowSpan="2">Section</th> {/* Added Section column */}
                                <th colSpan="10">Telugu</th>
                                <th colSpan="10">Hindi</th>
                                <th colSpan="10">English</th>
                                <th colSpan="10">Mathematics</th>
                                <th colSpan="10">Social</th>
                                <th rowSpan="2">Grand Total</th>
                                <th rowSpan="2">Total Grade</th>
                                <th rowSpan="2">GPA</th>
                                <th rowSpan="2">Percentage</th>
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
                                    <td>{student.section}</td> {/* Display Section */}
                                    {['telugu', 'hindi', 'english', 'mathematics', 'social'].map(subject => (
                                        <React.Fragment key={subject}>
                                            {maxMarks.map((_, subIndex) => (
                                                <td key={subIndex}>
                                                    <input
                                                        type="number"
                                                        value={student[subject][subIndex]}
                                                        onChange={(e) => handleInputChange(index, subject, subIndex, e.target.value)}
                                                        disabled={!isEditable}// Disable input for columns after the first 7
                                                    />
                                                </td>
                                            ))}
                                            <td>{student[subject][7]}</td>
                                            <td>{student[subject][8]}</td>
                                            <td>{student[subject][9]}</td>
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
                </main>
            )}
        </div>
    );
}

ReactDOM.render(<StudentMarksEntry />, document.getElementById('root'));
