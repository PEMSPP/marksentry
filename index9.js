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

const calculateSGPA = subTotal => (subTotal / 50 * 10).toFixed(1); // Assuming total max marks of 50

const calculateGPA = grandTotal => (grandTotal / 350 * 10).toFixed(1); // Updated assuming total max marks of 350

const calculatePercentage = grandTotal => ((grandTotal / 350) * 100).toFixed(1); // Updated assuming total max marks of 350

// React component
function StudentMarksEntry() {
    const [selectedSchool, setSelectedSchool] = useState('');
    const [students, setStudents] = useState([]);

    useEffect(() => {
        const fetchSchoolData = async (school) => {
            const response = await fetch('studentsData9.json');
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
        student[subject][5] = calculateTotal(student[subject]);
        student[subject][6] = calculateGrade(student[subject][5]);
        student[subject][7] = calculateSGPA(student[subject][5]);
    
        student.grandTotal = student.telugu[5] + student.hindi[5] + student.english[5] + student.mathematics[5] + student.pscience[5] + student.nscience[5] + student.social[5];
        student.totalGrade = calculateGrade(student.grandTotal);
        student.gpa = calculateGPA(student.grandTotal);
        student.percentage = calculatePercentage(student.grandTotal);
    
        // Update state
        setStudents(newStudents);
    };

     const saveDataToDatabase = async () => {
        const schoolName = selectedSchool; // Save under the selected school name

        if (window.confirm("Data is saving to database. Do you want to continue?")) {
            for (const student of students) {
                const sno = student.sno; // Unique identifier for each student within a school
                const studentDataPath = `https://marksentry-bcdd1-default-rtdb.firebaseio.com/FA1MARKS/CLASS-9/${schoolName}/${sno}.json`;
    
                // Check if student data already exists to prevent duplicates
                const response = await axios.get(studentDataPath);
    
                if (response.data) {
                    // Student data already exists, update the record
                    await axios.put(studentDataPath, student);
                } else {
                    // Student data does not exist, create a new record
                    await axios.post(`https://marksentry-bcdd1-default-rtdb.firebaseio.com/FA1MARKS/CLASS-9/${schoolName}.json`, { [sno]: student });
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
    
        ws['!merges'] = mergeRanges;
    
        // Adjust column widths
        const wscols = [
            { wch: 5 }, { wch: 20 }, { wch: 15 }, { wch: 10 },
            ...Array(56).fill({ wch: 12 }),
            { wch: 12 }, { wch: 10 }, { wch: 10 }, { wch: 15 }
        ];
        ws['!cols'] = wscols;
    
        XLSX.utils.book_append_sheet(wb, ws, `${selectedSchool}_Marks`);
        XLSX.writeFile(wb, `${selectedSchool}_Marks.xlsx`);
    };
    

    return (
        <div>
            <h1>Class 8 FA1 Marks Entry</h1>
            <label>
                Select School:
                <select value={selectedSchool} onChange={e => setSelectedSchool(e.target.value)}>
                    <option value="">-- Select School --</option>
                    {schools.map((school, index) => (
                        <option key={index} value={school.name}>{school.name}</option>
                    ))}
                </select>
            </label>

            {students.length > 0 && (
                <div>
                    <button onClick={saveToExcel}>Save to Excel</button>
                    <button onClick={saveDataToDatabase}>Save to Database</button>
                    <table>
                        <thead>
                            <tr>
                                <th rowSpan="2">SNo</th>
                                <th rowSpan="2">Student Name</th>
                                <th rowSpan="2">Pen Number</th>
                                <th rowSpan="2">Section</th>
                                {['Telugu', 'Hindi', 'English', 'Mathematics', 'PScience', 'NScience', 'Social'].map(subject => (
                                    <th key={subject} colSpan="8">{subject}</th>
                                ))}
                                <th rowSpan="2">Grand Total</th>
                                <th rowSpan="2">Total Grade</th>
                                <th rowSpan="2">GPA</th>
                                <th rowSpan="2">Percentage</th>
                            </tr>
                            <tr>
                                {Array(7).fill(['FA1-20M', 'Children\'s Participation', 'Written Work', 'Speaking', 'Behaviour', 'SubTotal', 'Grade', 'SGPA']).flat().map((sub, index) => (
                                    <th key={index}>{sub}</th>
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
                                    {['telugu', 'hindi', 'english', 'mathematics', 'pscience', 'nscience', 'social'].map((subject, subIndex) => (
                                        student[subject].slice(0, 8).map((mark, i) => (
                                            <td key={i}>
                                                {i < 5 ? (
                                                    <input
                                                        type="number"
                                                        value={mark}
                                                        onChange={e => handleInputChange(index, subject, i, e.target.value)}
                                                    />
                                                ) : mark}
                                            </td>
                                        ))
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

// Render the component
createRoot(document.getElementById('root')).render(<StudentMarksEntry />);
