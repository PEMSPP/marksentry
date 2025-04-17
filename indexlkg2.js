const { useState, useEffect, useRef } = React;
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

const calculateSGPA = subTotal => (subTotal / 100 * 10).toFixed(1);
const calculateTotalGrade = grandTotal => {
    if (grandTotal >= 360) return 'A1';
    if (grandTotal >= 310) return 'A2';
    if (grandTotal >= 260) return 'B1';
    if (grandTotal >= 210) return 'B2';
    if (grandTotal >= 160) return 'C1';
    if (grandTotal >= 110) return 'C2';
    if (grandTotal >= 80) return 'D1';
    return 'D2';
};

const calculateGPA = grandTotal => (grandTotal / 400 * 10).toFixed(1);
const calculatePercentage = grandTotal => ((grandTotal / 400) * 100).toFixed(1);

function StudentMarksEntry() {
    const [selectedSchool, setSelectedSchool] = useState('');
    const [students, setStudents] = useState([]);
    const [filteredStudents, setFilteredStudents] = useState([]);
    const inputRefs = useRef({});

    useEffect(() => {
        const fetchSchoolDataFromFirebase = async (school) => {
            const response = await axios.get(`https://marks-81ffd-default-rtdb.firebaseio.com/2024/SA-2/schools/${school}/LKG.json`);
            const data = response.data || [];
            return Object.keys(data).map((key, index) => ({
                sno: index + 1,
                studentName: data[key].studentName,
                penNumber: data[key].penNumber,
                section: data[key].section,
                rhymes: data[key].rhymes || [''],
                colouring: data[key].colouring || [''],
                english: data[key].english || [''],
                mathematics: data[key].mathematics || [''],
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

        if (value === '' || value === 'A' || (!isNaN(value) && value >= 0 && value <= maxMarks)) {
            let finalValue = value;
            if (!isNaN(value) && value.length === 2) {
                finalValue = Math.min(Number(value) * 2, maxMarks);
            }
            student[subject][0] = finalValue;
        } else {
            alert(`Please enter a valid number (0-${maxMarks}) or "A" for absent.`);
            return;
        }

        student.grandTotal = ["rhymes", "colouring", "english", "mathematics"].reduce((acc, subj) => {
            return acc + (student[subj][0] === 'A' || student[subj][0] === '' ? 0 : Number(student[subj][0] || 0));
        }, 0);

        student.totalGrade = calculateTotalGrade(student.grandTotal);
        student.gpa = calculateGPA(student.grandTotal);
        student.percentage = calculatePercentage(student.grandTotal);

        setStudents(newStudents);
        setFilteredStudents(newStudents);
    };

    const handleKeyDown = (e, rowIndex, subject) => {
        const subjects = ["rhymes", "colouring", "english", "mathematics"];
        const subjectIndex = subjects.indexOf(subject);

        if (e.key === "ArrowRight" && subjectIndex < subjects.length - 1) {
            inputRefs.current[`${rowIndex}-${subjects[subjectIndex + 1]}`].focus();
        } else if (e.key === "ArrowLeft" && subjectIndex > 0) {
            inputRefs.current[`${rowIndex}-${subjects[subjectIndex - 1]}`].focus();
        } else if (e.key === "ArrowDown" && rowIndex < filteredStudents.length - 1) {
            inputRefs.current[`${rowIndex + 1}-${subject}`].focus();
        } else if (e.key === "ArrowUp" && rowIndex > 0) {
            inputRefs.current[`${rowIndex - 1}-${subject}`].focus();
        }
    };

    const saveDataToDatabase = () => {
        if (!selectedSchool) {
            alert('Please select a school first.');
            return;
        }

        alert('Data is saving to the database...');
        axios
            .put(`https://marks-81ffd-default-rtdb.firebaseio.com/2024/SA-2/schools/${selectedSchool}/LKG.json`, students)
            .then(() => alert('Data saved successfully!'))
    };

    const saveToExcel = () => {
        const XLSX = window.XLSX;
        const wb = XLSX.utils.book_new();
        const headers = [
            "Sno", "Student Name", "Pen Number", "Section", "Rhymes", "Colouring", "English", "Mathematics",
            "Grand Total", "Total Grade", "GPA", "Percentage"
        ];
        const rows = students.map((student, index) => ([
            index + 1, student.studentName || '', student.penNumber || '', student.section || '',
            student.rhymes || '', student.colouring || '', student.english || '', student.mathematics || '',
            student.grandTotal || '', student.totalGrade || '', student.gpa || '', student.percentage || ''
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
                    <button onClick={saveToExcel}>Save to Excel</button>
                    <table border="1">
                        <thead>
                            <tr>
                                <th>Sno</th>
                                <th>Student Name</th>
                                <th>Pen Number</th>
                                <th>Section</th>
                                <th>Rhymes</th>
                                <th>Colouring</th>
                                <th>English</th>
                                <th>Mathematics</th>
                                <th>Grand Total</th>
                                <th>Total Grade</th>
                                <th>GPA</th>
                                <th>Percentage</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredStudents.map((student, rowIndex) => (
                                <tr key={student.sno}>
                                    <td>{student.sno}</td>
                                    <td>{student.studentName}</td>
                                    <td>{student.penNumber}</td>
                                    <td>{student.section}</td>
                                    {["rhymes", "colouring", "english", "mathematics"].map(subject => (
                                        <td key={subject}>
                                            <input
                                                type="text"
                                                value={student[subject][0]}
                                                onChange={e => handleInputChange(rowIndex, subject, e.target.value)}
                                                onKeyDown={e => handleKeyDown(e, rowIndex, subject)}
                                                ref={el => inputRefs.current[`${rowIndex}-${subject}`] = el}
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
