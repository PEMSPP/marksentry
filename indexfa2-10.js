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

// Function to get the maximum marks for each sub-column based on the subject
const getMaxMarks = (subject, subIndex) => {
    if (subject === 'pscience' || subject === 'nscience') {
        const pscienceMaxMarks = [25, 10, 10, 5, 5]; 
        return pscienceMaxMarks[subIndex];
    }

    const otherSubjectMaxMarks = [50, 10, 10, 5, 5]; 
    return otherSubjectMaxMarks[subIndex];
};

// Calculate totals, grades, and SGPA
const calculateTotal = marks => marks.slice(0, 5).reduce((a, b) => a + Number(b), 0);
const calculateGrade = (total, subject) => {
    let grade = '';
    const maxMarks = subject === 'pscience' || subject === 'nscience' ? 55 : 80;
    const thresholds = {
        A1: maxMarks * 0.9,
        A2: maxMarks * 0.8,
        B1: maxMarks * 0.7,
        B2: maxMarks * 0.6,
        C1: maxMarks * 0.5,
        C2: maxMarks * 0.4,
        D1: maxMarks * 0.3,
        D2: maxMarks * 0
    };

    if (total >= thresholds.A1) grade = 'A1';
    else if (total >= thresholds.A2) grade = 'A2';
    else if (total >= thresholds.B1) grade = 'B1';
    else if (total >= thresholds.B2) grade = 'B2';
    else if (total >= thresholds.C1) grade = 'C1';
    else if (total >= thresholds.C2) grade = 'C2';
    else if (total >= thresholds.D1) grade = 'D1';
    else grade = 'D2';

    return grade;
};

const calculateSGPA = (subTotal, subject) => {
    const max = subject === 'pscience' || subject === 'nscience' ? 55 : 80;
    return ((subTotal / max) * 10).toFixed(1);
};

const calculateTotalGrade = grandTotal => {
    if (grandTotal >= 387 && grandTotal <= 430) return 'A1';
    if (grandTotal >= 344 && grandTotal <= 386) return 'A2';
    if (grandTotal >= 301 && grandTotal <= 343) return 'B1';
    if (grandTotal >= 258 && grandTotal <= 300) return 'B2';
    if (grandTotal >= 215 && grandTotal <= 257) return 'C1';
    if (grandTotal >= 172 && grandTotal <= 214) return 'C2';
    if (grandTotal >= 129 && grandTotal <= 171) return 'D1';
    if (grandTotal >= 0 && grandTotal <= 128) return 'D2';
    return '';
};

const calculateGPA = grandTotal => (grandTotal / 430 * 10).toFixed(1);
const calculatePercentage = grandTotal => ((grandTotal / 430) * 100).toFixed(1);

// React component
function StudentMarksEntry() {
    const [selectedSchool, setSelectedSchool] = useState('');
    const [students, setStudents] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [filteredStudents, setFilteredStudents] = useState([]);

    useEffect(() => {
        const fetchSchoolData = async (school) => {
            try {
                const response = await axios.get(`https://marksentry2024-default-rtdb.firebaseio.com/2024/FA-2/schools/${school}/Class-10.json`);
                const data = response.data || [];
                return Object.keys(data).map((key, index) => ({
                    sno: index + 1,
                    studentName: data[key].studentName,
                    penNumber: data[key].penNumber,
                    section: data[key].section,
                    telugu: data[key].telugu || ['', '', '', '', '', 0, '', 0],
                    hindi: data[key].hindi || ['', '', '', '', '', 0, '', 0],
                    english: data[key].english || ['', '', '', '', '', 0, '', 0],
                    mathematics: data[key].mathematics || ['', '', '', '', '', 0, '', 0],
                    pscience: data[key].pscience || ['', '', '', '', '', 0, '', 0],
                    nscience: data[key].nscience || ['', '', '', '', '', 0, '', 0],
                    social: data[key].social || ['', '', '', '', '', 0, '', 0],
                    grandTotal: data[key].grandTotal || 0,
                    totalGrade: data[key].totalGrade || '',
                    gpa: data[key].gpa || 0,
                    percentage: data[key].percentage || 0
                }));
            } catch (error) {
                console.error('Error fetching school data:', error);
                return [];
            }
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
            setFilteredStudents(allData);
        };

        if (selectedSchool) {
            if (selectedSchool === 'ALL') {
                fetchAllData();
            } else {
                fetchSchoolData(selectedSchool).then(data => {
                    setStudents(data);
                    setFilteredStudents(data);
                });
            }
        }
    }, [selectedSchool]);

    const handleInputChange = (index, subject, subIndex, value) => {
        const newStudents = [...students];
        const student = newStudents[index];
        const maxValue = getMaxMarks(subject, subIndex);

        if (value < 0 || value > maxValue) {
            alert(`Enter the marks according to Limit. Maximum allowed is ${maxValue}`);
            return;
        }

        student[subject][subIndex] = value;
        student[subject][5] = calculateTotal(student[subject]);
        student[subject][6] = calculateGrade(student[subject][5], subject);
        student[subject][7] = calculateSGPA(student[subject][5], subject);

        student.grandTotal = student.telugu[5] + student.hindi[5] + student.english[5] + student.mathematics[5] + student.pscience[5] + student.nscience[5] + student.social[5];
        student.totalGrade = calculateTotalGrade(student.grandTotal);
        student.gpa = calculateGPA(student.grandTotal);
        student.percentage = calculatePercentage(student.grandTotal);

        setStudents(newStudents);
        setFilteredStudents(newStudents); // Update filtered students as well
    };

    const handleKeyDown = (e, index, subject, subIndex) => {
        const rowCount = students.length;
        const subjects = ['telugu', 'hindi', 'english', 'mathematics', 'pscience', 'nscience', 'social'];
        const colCount = 8;

        if (e.key.startsWith("Arrow")) {
            e.preventDefault();
            let [newIndex, newSubIndex, newSubject] = [index, subIndex, subject];

            if (e.key === "ArrowUp" && newIndex > 0) {
                newIndex--;
            } else if (e.key === "ArrowDown" && newIndex < rowCount - 1) {
                newIndex++;
            } else if (e.key === "ArrowLeft") {
                if (newSubIndex > 0) {
                    newSubIndex--;
                } else {
                    const subjectIndex = subjects.indexOf(newSubject);
                    if (subjectIndex > 0) {
                        newSubject = subjects[subjectIndex - 1];
                        newSubIndex = colCount - 1;
                    }
                }
            } else if (e.key === "ArrowRight") {
                if (newSubIndex < colCount - 1) {
                    newSubIndex++;
                } else {
                    const subjectIndex = subjects.indexOf(newSubject);
                    if (subjectIndex < subjects.length - 1) {
                        newSubject = subjects[subjectIndex + 1];
                        newSubIndex = 0;
                    }
                }
            }

            const newInputId = `input-${newIndex}-${newSubject}-${newSubIndex}`;
            const newInput = document.getElementById(newInputId);
            if (newInput) {
                newInput.focus();
            }
        }
    };

    const handleSearchInput = (e) => {
        const value = e.target.value;

        // Validate input: only alphabets or only numbers allowed, no alphanumeric combinations
        if (/^[a-zA-Z]+$/.test(value) || /^\d+$/.test(value) || value === '') {
            setSearchQuery(value);
        } else {
            alert('Search input can only be either alphabets or numbers, but not a mix of both.');
        }
    };

    const handleSearchKeyDown = (e) => {
        if (e.key === 'Enter') {
            const filtered = students.filter(student => 
                student.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                student.penNumber.includes(searchQuery) ||
                student.sno.toString() === searchQuery
            );
            setFilteredStudents(filtered);
        }
    };

    const saveToDatabase = async () => {
        if (!selectedSchool) {
            alert('Please select a school first.');
            return;
        }
        alert('Data is saving to the database...');

        axios
            .put(`https://marksentry2024-default-rtdb.firebaseio.com/2024/FA-2/schools/${selectedSchool}/Class-10.json`, students)
            .then(() => {
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

        const data = students.map(student => [
            student.sno,
            student.studentName,
            student.penNumber,
            student.section,
            ...student.telugu,
            ...student.hindi,
            ...student.english,
            ...student.mathematics,
            ...student.pscience,
            ...student.nscience,
            ...student.social,
            student.grandTotal,
            student.totalGrade,
            student.gpa,
            student.percentage
        ]);

        const wsData = [headers1, headers2, ...data];
        const ws = XLSX.utils.aoa_to_sheet(wsData);

        ws['!merges'] = [
            { s: { r: 0, c: 4 }, e: { r: 0, c: 11 } },
            { s: { r: 0, c: 12 }, e: { r: 0, c: 19 } },
            { s: { r: 0, c: 20 }, e: { r: 0, c: 27 } },
            { s: { r: 0, c: 28 }, e: { r: 0, c: 35 } },
            { s: { r: 0, c: 36 }, e: { r: 0, c: 43 } },
            { s: { r: 0, c: 44 }, e: { r: 0, c: 51 } },
            { s: { r: 0, c: 52 }, e: { r: 0, c: 59 } },
            { s: { r: 0, c: 60 }, e: { r: 0, c: 63 } }
        ];

        const range = XLSX.utils.decode_range(ws['!ref']);
        for (let R = range.s.r; R <= range.e.r; ++R) {
            for (let C = range.s.c; C <= range.e.c; ++C) {
                const cellAddress = XLSX.utils.encode_cell({ r: R, c: C });
                if (!ws[cellAddress]) ws[cellAddress] = { t: 's', v: '' };
                if (!ws[cellAddress].s) ws[cellAddress].s = {};
                ws[cellAddress].s.border = {
                    top: { style: "thin", color: { auto: 1 } },
                    right: { style: "thin", color: { auto: 1 } },
                    bottom: { style: "thin", color: { auto: 1 } },
                    left: { style: "thin", color: { auto: 1 } }
                };
            }
        }

        XLSX.utils.book_append_sheet(wb, ws, `${selectedSchool}_Data`);
        XLSX.writeFile(wb, `${selectedSchool}_StudentData.xlsx`);
    };

    return (
        <div>
            <h1>Student Marks Entry</h1>
            <select value={selectedSchool} onChange={e => setSelectedSchool(e.target.value)}>
                <option value="">Select a school</option>
                {schools.map(school => (
                    <option key={school.name} value={school.name}>{school.name}</option>
                ))}
            </select>

            {selectedSchool && (
                <div>
                    <button onClick={saveToDatabase}>Save to Database</button>
                    <button onClick={saveToExcel}>Save to Excel</button>

                    {/* Search Bar */}
                    <input
                        type="text"
                        placeholder="Search by Student Name, Pen Number, or S.No."
                        value={searchQuery}
                        onChange={handleSearchInput}
                        onKeyDown={handleSearchKeyDown}
                    />

                    {filteredStudents.length > 0 ? (
                        <table border="1">
                            <thead>
                                <tr>
                                    <th rowSpan="2">Sno</th>
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
                                    {Array(7).fill(['FA2', 'Children\'s Participation', 'Written Work', 'Speaking', 'Behaviour', 'SubTotal', 'Grade', 'SGPA']).flat().map(header => (
                                        <th key={header}>{header}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {filteredStudents.map((student, index) => (
                                    <tr key={student.penNumber}>
                                        <td>{student.sno}</td>
                                        <td>{student.studentName}</td>
                                        <td>{student.penNumber}</td>
                                        <td>{student.section}</td>
                                        {['telugu', 'hindi', 'english', 'mathematics', 'pscience', 'nscience', 'social'].map(subject => (
                                            student[subject].map((mark, subIndex) => (
                                                <td key={`${subject}-${subIndex}`}>
                                                    {subIndex < 5 ? (
                                                        <input
                                                            type="number"
                                                            value={mark}
                                                            onChange={e => handleInputChange(index, subject, subIndex, e.target.value)}
                                                            onKeyDown={e => handleKeyDown(e, index, subject, subIndex)}
                                                            id={`input-${index}-${subject}-${subIndex}`}
                                                         disabled={selectedSchool === 'Talaricheruvu' || 'Boyareddypalli' || 'Mantapampalli' || 'Ganesh Pahad' || 'Tandur' || 'ALL' }
                                                        />
                                                    ) : (
                                                        mark
                                                    )}
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
                    ) : (
                        <p>No student data found.</p>
                    )}
                </div>
            )}
        </div>
    );
}

// Render the component
const root = createRoot(document.getElementById('root'));
root.render(<StudentMarksEntry />);
