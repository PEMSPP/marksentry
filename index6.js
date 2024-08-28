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

const calculateGPA = grandTotal => (grandTotal / 300 * 10).toFixed(1); // Updated assuming total max marks of 300

const calculatePercentage = grandTotal => ((grandTotal / 300) * 100).toFixed(1); // Updated assuming total max marks of 300

// React component
function StudentMarksEntry() {
    const [selectedSchool, setSelectedSchool] = useState('');
    const [students, setStudents] = useState([]);

    useEffect(() => {
        const fetchSchoolData = async (school) => {
            const response = await fetch('studentsData6.json');
            const data = await response.json();
            const schoolData = data[school] || [];
            return schoolData.map((student, index) => ({
                ...student,
                sno: index + 1,
                section: student.section,
                telugu: ['', '', '', '', '', 0, '', 0],
                hindi: ['', '', '', '', '', 0, '', 0],
                english: ['', '', '', '', '', 0, '', 0],
                mathematics: ['', '', '', '', '', 0, '', 0],
                science: ['', '', '', '', '', 0, '', 0],
                social: ['', '', '', '', '', 0, '', 0],
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

        student.grandTotal = student.telugu[5] + student.hindi[5] + student.english[5] + student.mathematics[5] + student.science[5] + student.social[5];
        student.totalGrade = calculateGrade(student.grandTotal);
        student.gpa = calculateGPA(student.grandTotal);
        student.percentage = calculatePercentage(student.grandTotal);

        // Update state
        setStudents(newStudents);
    };

    const saveToDatabase = async () => {
        const schoolName = selectedSchool;
        const confirmation = window.confirm("Data is saving to the database. Click OK to proceed.");

        if (confirmation) {
          
                for (const student of students) {
                    const sno = student.sno; // Unique identifier for each student within a school
                    const studentDataPath = `https://marksentry-bcdd1-default-rtdb.firebaseio.com/FA1MARKS/CLASS-6/${schoolName}/${sno}.json`;
        
                    // Check if student data already exists to prevent duplicates
                    const response = await axios.get(studentDataPath);
        
                    if (response.data) {
                        // Student data already exists, update the record
                        await axios.put(studentDataPath, student);
                    } else {
                        // Student data does not exist, create a new record
                        await axios.post(`https://marksentry-bcdd1-default-rtdb.firebaseio.com/FA1MARKS/CLASS-6/${schoolName}.json`, { [sno]: student });
                    }
                
            }
            alert('Data saved successfully');
        }
    };
    const saveToExcel = () => {
        const XLSX = window.XLSX;
        const wb = XLSX.utils.book_new();

        const headers1 = [
            "Sno", "Student Name", "Pen Number", "Section",
            "Telugu", "", "", "", "", "", "", "",
            "Hindi", "", "", "", "", "", "", "",
            "English", "", "", "", "", "", "", "",
            "Mathematics", "", "", "", "", "", "", "",
            "Science", "", "", "", "", "", "", "",
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
            "", "", "", ""
        ];

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

        const mergeRanges = [
            { s: { r: 0, c: 4 }, e: { r: 0, c: 11 } }, // Telugu
            { s: { r: 0, c: 12 }, e: { r: 0, c: 19 } }, // Hindi
            { s: { r: 0, c: 20 }, e: { r: 0, c: 27 } }, // English
            { s: { r: 0, c: 28 }, e: { r: 0, c: 35 } }, // Mathematics
            { s: { r: 0, c: 36 }, e: { r: 0, c: 43 } }, // Science
            { s: { r: 0, c: 44 }, e: { r: 0, c: 51 } }, // Social
        ];

        if (!ws['!merges']) ws['!merges'] = [];
        ws['!merges'].push(...mergeRanges);

        ws['!cols'] = [
            { wpx: 50 }, { wpx: 100 }, { wpx: 80 }, { wpx: 50 }, // Fixed columns
            { wpx: 50 }, { wpx: 50 }, { wpx: 50 }, { wpx: 50 }, { wpx: 50 }, { wpx: 50 }, { wpx: 50 }, { wpx: 50 }, // Telugu
            { wpx: 50 }, { wpx: 50 }, { wpx: 50 }, { wpx: 50 }, { wpx: 50 }, { wpx: 50 }, { wpx: 50 }, { wpx: 50 }, // Hindi
            { wpx: 50 }, { wpx: 50 }, { wpx: 50 }, { wpx: 50 }, { wpx: 50 }, { wpx: 50 }, { wpx: 50 }, { wpx: 50 }, // English
            { wpx: 50 }, { wpx: 50 }, { wpx: 50 }, { wpx: 50 }, { wpx: 50 }, { wpx: 50 }, { wpx: 50 }, { wpx: 50 }, // Mathematics
            { wpx: 50 }, { wpx: 50 }, { wpx: 50 }, { wpx: 50 }, { wpx: 50 }, { wpx: 50 }, { wpx: 50 }, { wpx: 50 }, // Science
            { wpx: 50 }, { wpx: 50 }, { wpx: 50 }, { wpx: 50 }, { wpx: 50 }, { wpx: 50 }, { wpx: 50 }, { wpx: 50 }, // Social
            { wpx: 50 }, { wpx: 50 }, { wpx: 50 }, { wpx: 50 }  // Grand Total, Grade, GPA, Percentage
        ];

        XLSX.utils.book_append_sheet(wb, ws, "Student Marks");
        XLSX.writeFile(wb, "Student_Marks.xlsx");
    };

    return (
        <div>
            <label htmlFor="school-select">Select a School: </label>
            <select id="school-select" onChange={e => setSelectedSchool(e.target.value)} value={selectedSchool}>
                <option value="">--Select--</option>
                {schools.map(school => (
                    <option key={school.name} value={school.name}>{school.name}</option>
                ))}
            </select>
            <button onClick={saveToDatabase} disabled={!selectedSchool}>Save to Database</button>
            <button onClick={saveToExcel} disabled={!selectedSchool}>Save to Excel</button>
            {students.length > 0 && (
                <table border="1">
                    <thead>
                        <tr>
                            <th rowSpan="2">Sno</th>
                            <th rowSpan="2">Student Name</th>
                            <th rowSpan="2">Pen Number</th>
                            <th rowSpan="2">Section</th>
                            <th colSpan="8">Telugu</th>
                            <th colSpan="8">Hindi</th>
                            <th colSpan="8">English</th>
                            <th colSpan="8">Mathematics</th>
                            <th colSpan="8">Science</th>
                            <th colSpan="8">Social</th>
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
                        </tr>
                    </thead>
                    <tbody>
                        {students.map((student, index) => (
                            <tr key={index}>
                                <td>{student.sno}</td>
                                <td>{student.studentName}</td>
                                <td>{student.penNumber}</td>
                                <td>{student.section}</td>
                                {['telugu', 'hindi', 'english', 'mathematics', 'science', 'social'].map(subject =>
                                    student[subject].slice(0, 5).map((mark, subIndex) => (
                                        <td key={`${subject}-${subIndex}`}>
                                            <input
                                                type="number"
                                                value={mark}
                                                onChange={e => handleInputChange(index, subject, subIndex, e.target.value)}
                                            />
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
        </div>
    );
}

createRoot(document.getElementById('root')).render(<StudentMarksEntry />);


