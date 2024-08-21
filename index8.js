
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
const maxMarks = [20, 10, 10, 5, 5]; // FA1-20M, Children's Participation, Written Work, Speaking, Behaviour

// Calculate totals, grades, and SGPA
const calculateTotal = marks => marks.slice(0, 5).reduce((a, b) => a + Number(b), 0);

const calculateGrade = total => {
    if (total <= 9) return 'D';
    if (total <= 19) return 'C';
    if (total <= 29) return 'B2';
    if (total <= 39) return 'B1';
    if (total <= 45) return 'A2';
    return 'A1';
};

const calculateSGPA = subTotal => (subTotal / 50 * 10).toFixed(2); // Assuming total max marks of 50

const calculateGPA = grandTotal => (grandTotal / 350 * 10).toFixed(2); // Updated assuming total max marks of 350

const calculatePercentage = grandTotal => ((grandTotal / 350) * 100).toFixed(2); // Updated assuming total max marks of 350

// React component
function StudentMarksEntry() {
    const [selectedSchool, setSelectedSchool] = useState('');
    const [students, setStudents] = useState([]);
    const [isEditable, setIsEditable] = useState(true);
    const [isSaveEnabled, setIsSaveEnabled] = useState(false);

    useEffect(() => {
        const fetchSchoolData = async (school) => {
            const response = await fetch('studentsData8.json');
            const data = await response.json();
            const schoolData = data[school] || [];
            return schoolData.map((student, index) => ({
                ...student,
                sno: index + 1,
                section: student.section, // Fetch section from the data
                telugu: ['', '', '', '', '', 0, '', 0],
                hindi: ['', '', '', '', '', 0, '', 0],
                english: ['', '', '', '', '', 0, '', 0],
                mathematics: ['', '', '', '', '', 0, '', 0],
                pscience: ['', '', '', '', '', 0, '', 0], // Added Science
                nscience: ['', '', '', '', '', 0, '', 0], // Changed from EVS to Social
                social: ['', '', '', '', '', 0, '', 0], // Added Biology
                subject: ['FA1-20M', 'Children\'s Participation', 'Written Work', 'Speaking', 'Behaviour', 'SubTotal', 'Grade', 'SGPA'],
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

    useEffect(() => {
        const handleBeforeUnload = (event) => {
            if (isSaveEnabled) {
                saveData();
                event.returnValue = 'Are you sure you want to leave? Your data will be saved.';
            }
        };

        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => {
            window.removeEventListener('beforeunload', handleBeforeUnload);
        };
    }, [students, isSaveEnabled]);

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
        student[subject][5] = calculateTotal(student[subject]);
        student[subject][6] = calculateGrade(student[subject][5]);
        student[subject][7] = calculateSGPA(student[subject][5]);
    
        student.grandTotal = student.telugu[5] + student.hindi[5] + student.english[5] + student.mathematics[5] + student.pscience[5] + student.nscience[5] + student.social[5];
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
            ['telugu', 'hindi', 'english', 'mathematics', 'pscience', 'nscience', 'social'].every(subject => 
                student[subject].slice(0, 5).every(mark => mark !== '' && mark !== null && mark !== undefined)
            )
        );
    
        if (allFieldsFilled) {
            alert('All data has been entered and saved. The webpage will now become static.');
            setIsEditable(false);
        }
    };
    
    const saveData = () => {
        axios.post('https://marksentry-bcdd1-default-rtdb.firebaseio.com/Class-8.json', students)
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
        const headers1 = [
            "Sno", "Student Name", "Pen Number", "Section",
            "Telugu", "", "", "", "", "", "", "",
            "Hindi", "", "", "", "", "", "", "",
            "English", "", "", "", "", "", "", "",
            "Mathematics", "", "", "", "", "", "", "",
            "PScience", "", "", "", "", "", "", "",
            "NScience", "", "", "", "", "", "", "",
            "Social", "", "", "", "", "", "", "",
            "Grand Total", "Total Grade", "GPA", "Percentage"
        ];
    
        const headers2 = [
            "", "", "", "",
            "FA1-20M", "Children's Participation", "Written Work", "Speaking", "Behaviour", "SubTotal", "Grade", "SGPA",
            "FA1-20M", "Children's Participation", "Written Work", "Speaking", "Behaviour", "SubTotal", "Grade", "SGPA",
            "FA1-20M", "Children's Participation", "Written Work", "Speaking", "Behaviour", "SubTotal", "Grade", "SGPA",
            "FA1-20M", "Children's Participation", "Written Work", "Speaking", "Behaviour", "SubTotal", "Grade", "SGPA",
            "FA1-20M", "Children's Participation", "Written Work", "Speaking", "Behaviour", "SubTotal", "Grade", "SGPA",
            "FA1-20M", "Children's Participation", "Written Work", "Speaking", "Behaviour", "SubTotal", "Grade", "SGPA",
            "FA1-20M", "Children's Participation", "Written Work", "Speaking", "Behaviour", "SubTotal", "Grade", "SGPA",
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
                ...student.pscience,
                ...student.nscience,
                ...student.social,
                student.grandTotal, student.totalGrade, student.gpa, student.percentage
            ]);
        });
    
        const ws = XLSX.utils.aoa_to_sheet(ws_data);
    
        // Merge cells for the first header row where applicable
        const mergeRanges = [
            { s: { r: 0, c: 4 }, e: { r: 0, c: 11 } }, // Telugu
            { s: { r: 0, c: 12 }, e: { r: 0, c: 19 } }, // Hindi
            { s: { r: 0, c: 20 }, e: { r: 0, c: 27 } }, // English
            { s: { r: 0, c: 28 }, e: { r: 0, c: 35 } }, // Mathematics
            { s: { r: 0, c: 36 }, e: { r: 0, c: 43 } }, // PScience
            { s: { r: 0, c: 44 }, e: { r: 0, c: 51 } }, // NScience
            { s: { r: 0, c: 52 }, e: { r: 0, c: 59 } }, // Social

        ];
    
        if (!ws['!merges']) ws['!merges'] = [];
        ws['!merges'].push(...mergeRanges);
    
        // Adjust column width for better readability (optional)
        ws['!cols'] = [
            { wpx: 50 }, { wpx: 100 }, { wpx: 80 }, { wpx: 50 }, // Fixed columns
            { wpx: 80 }, { wpx: 80 }, { wpx: 80 }, { wpx: 80 }, { wpx: 80 }, { wpx: 80 }, { wpx: 80 }, { wpx: 80 }, // Telugu
            { wpx: 80 }, { wpx: 80 }, { wpx: 80 }, { wpx: 80 }, { wpx: 80 }, { wpx: 80 }, { wpx: 80 }, { wpx: 80 }, // Hindi
            { wpx: 80 }, { wpx: 80 }, { wpx: 80 }, { wpx: 80 }, { wpx: 80 }, { wpx: 80 }, { wpx: 80 }, { wpx: 80 }, // English
            { wpx: 80 }, { wpx: 80 }, { wpx: 80 }, { wpx: 80 }, { wpx: 80 }, { wpx: 80 }, { wpx: 80 }, { wpx: 80 }, // Mathematics
            { wpx: 80 }, { wpx: 80 }, { wpx: 80 }, { wpx: 80 }, { wpx: 80 }, { wpx: 80 }, { wpx: 80 }, { wpx: 80 }, // Science
            { wpx: 80 }, { wpx: 80 }, { wpx: 80 }, { wpx: 80 }, { wpx: 80 }, { wpx: 80 }, { wpx: 80 }, { wpx: 80 }, // Social
            { wpx: 80 }, { wpx: 80 }, { wpx: 80 }, { wpx: 80 }, { wpx: 80 }, { wpx: 80 }, { wpx: 80 }, { wpx: 80 },
            { wpx: 100 }, { wpx: 80 }, { wpx: 50 }, { wpx: 80 } // Grand Total, Grade, GPA, Percentage
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
                                <th colSpan="8">Telugu</th>
                                <th colSpan="8">Hindi</th>
                                <th colSpan="8">English</th>
                                <th colSpan="8">Mathematics</th>
                                <th colSpan="8">PScience</th> {/* Added Science */}
                                <th colSpan="8">NScience</th> {/* Changed from EVS to Social */}
                                <th colSpan="8">Social</th> {/* Added Biology */}
                                <th rowSpan="2">Grand Total</th>
                                <th rowSpan="2">Total Grade</th>
                                <th rowSpan="2">GPA</th>
                                <th rowSpan="2">Percentage</th>
                            </tr>
                            <tr>
                                <th>FA1-20M</th>
                                <th>Children's Participation</th>
                                <th>Written Work</th>
                                <th>Speaking</th>
                                <th>Behaviour</th>
                                <th>SubTotal</th>
                                <th>Grade</th>
                                <th>SGPA</th>
                                <th>FA1-20M</th>
                                <th>Children's Participation</th>
                                <th>Written Work</th>
                                <th>Speaking</th>
                                <th>Behaviour</th>
                                <th>SubTotal</th>
                                <th>Grade</th>
                                <th>SGPA</th>
                                <th>FA1-20M</th>
                                <th>Children's Participation</th>
                                <th>Written Work</th>
                                <th>Speaking</th>
                                <th>Behaviour</th>
                                <th>SubTotal</th>
                                <th>Grade</th>
                                <th>SGPA</th>
                                <th>FA1-20M</th>
                                <th>Children's Participation</th>
                                <th>Written Work</th>
                                <th>Speaking</th>
                                <th>Behaviour</th>
                                <th>SubTotal</th>
                                <th>Grade</th>
                                <th>SGPA</th> 
                                <th>FA1-20M</th>
                                <th>Children's Participation</th>
                                <th>Written Work</th>
                                <th>Speaking</th>
                                <th>Behaviour</th>
                                <th>SubTotal</th>
                                <th>Grade</th>
                                <th>SGPA</th> 
                                <th>FA1-20M</th>
                                <th>Children's Participation</th>
                                <th>Written Work</th>
                                <th>Speaking</th>
                                <th>Behaviour</th>
                                <th>SubTotal</th>
                                <th>Grade</th>
                                <th>SGPA</th> 
                                <th>FA1-20M</th>
                                <th>Children's Participation</th>
                                <th>Written Work</th>
                                <th>Speaking</th>
                                <th>Behaviour</th>
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
                                    {['telugu', 'hindi', 'english', 'mathematics', 'pscience', 'nscience', 'social'].map(subject => (
                                        <React.Fragment key={subject}>
                                            {maxMarks.map((_, subIndex) => (
                                                <td key={subIndex}>
                                                    <input
                                                        type="number"
                                                        value={student[subject][subIndex]}
                                                        onChange={(e) => handleInputChange(index, subject, subIndex, e.target.value)}
                                                        disabled={!isEditable}// Disable input for columns after the first 5
                                                    />
                                                </td>
                                            ))}
                                            <td>{student[subject][5]}</td>
                                            <td>{student[subject][6]}</td>
                                            <td>{student[subject][7]}</td>
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
