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
    if (total >= 46 && total <= 50) return 'A1';
    if (total >= 41 && total <= 45) return 'A2';
    if (total >= 36 && total <= 40) return 'B1';
    if (total >= 31 && total <= 35) return 'B2';
    if (total >= 26 && total <= 30) return 'C1';
    if (total >= 21 && total <= 25) return 'C2';
    if (total >= 18 && total <= 20) return 'D1';
    if (total >= 0 && total <= 17) return 'D2';
    return ''; // Return empty string if no grade matches
};

const calculateTotalGrade = grandTotal => {
    if (grandTotal >= 319 && grandTotal <= 350) return 'A1';
    if (grandTotal >= 284 && grandTotal <= 318) return 'A2';
    if (grandTotal >= 249 && grandTotal <= 283) return 'B1';
    if (grandTotal >= 214 && grandTotal <= 248) return 'B2';
    if (grandTotal >= 179 && grandTotal <= 213) return 'C1';
    if (grandTotal >= 144 && grandTotal <= 178) return 'C2';
    if (grandTotal >= 123 && grandTotal <= 143) return 'D1';
    if (grandTotal >= 0 && grandTotal <= 122) return 'D2';
    return ''; // Return empty string if no grade matches
};

const calculateSGPA = subTotal => (subTotal / 50 * 10).toFixed(1); // Assuming total max marks of 50

const calculateGPA = grandTotal => (grandTotal / 350 * 10).toFixed(1); // Updated assuming total max marks of 350

const calculatePercentage = grandTotal => ((grandTotal / 350) * 100).toFixed(1); // Updated assuming total max marks of 350

// React component
function StudentMarksEntry() {
    const [selectedSchool, setSelectedSchool] = useState('');
    const [students, setStudents] = useState([]);
    const [searchQuery, setSearchQuery] = useState(''); // For search bar input
    const [filteredStudents, setFilteredStudents] = useState([]);

    useEffect(() => {
        const fetchSchoolData = async (school) => {
            try {
                const response = await axios.get(`https://marksentry2024-default-rtdb.firebaseio.com/2024/FA-2/schools/${school}/Class-8.json`);
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
                    setFilteredStudents(data); // Set initial filtered students to all students
                });
            }
        }
    }, [selectedSchool]);

    // Handle input changes and recalculate values
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
        student[subject][6] = calculateGrade(student[subject][5]); // SG calculation
        student[subject][7] = calculateSGPA(student[subject][5]);

        student.grandTotal = student.telugu[5] + student.hindi[5] + student.english[5] + student.mathematics[5] + student.pscience[5] + student.nscience[5] + student.social[5];
        student.totalGrade = calculateTotalGrade(student.grandTotal); // Total Grade calculation
        student.gpa = calculateGPA(student.grandTotal);
        student.percentage = calculatePercentage(student.grandTotal);

        // Update state
        setStudents(newStudents);
        setFilteredStudents(newStudents); // Also update filtered students
    };

    const handleKeyDown = (e, index, subject, subIndex) => {
        const rowCount = students.length;
        const subjects = ['telugu', 'hindi', 'english', 'mathematics', 'pscience', 'nscience', 'social'];
        const colCount = 8; // 8 columns per subject

        if (e.key.startsWith("Arrow")) {
            e.preventDefault(); // Prevent the default behavior (i.e., modifying the input)

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

            // Move focus to the new input field
            const newInputId = `input-${newIndex}-${newSubject}-${newSubIndex}`;
            const newInput = document.getElementById(newInputId);
            if (newInput) {
                newInput.focus();
            }
        }
    };

    // Handle search input and filtering
    const handleSearchChange = e => {
        const query = e.target.value;
        setSearchQuery(query);

        // Check if query contains only alphabets or only numbers (no alphanumeric allowed)
        if (/^[a-zA-Z]+$/.test(query) || /^[0-9]+$/.test(query)) {
            const filtered = students.filter(student =>
                student.studentName.toLowerCase().includes(query.toLowerCase()) ||
                student.penNumber.toString().includes(query) ||
                student.sno.toString().includes(query)
            );
            setFilteredStudents(filtered);
        } else {
            setFilteredStudents(students); // Reset if invalid input
        }
    };

    const saveToDatabase = async () => {
        if (!selectedSchool) {
            alert('Please select a school first.');
            return;
        }
        alert('Data is saving to the database...');

        axios
            .put(`https://marksentry2024-default-rtdb.firebaseio.com/2024/FA-2/schools/${selectedSchool}/Class-8.json`, students)
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

        // Combine headers and data
        const wsData = [headers1, headers2, ...data];
        const ws = XLSX.utils.aoa_to_sheet(wsData);

        // Merge header cells
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

        // Apply borders to all cells
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

        // Add the sheet to the workbook
        XLSX.utils.book_append_sheet(wb, ws, `${selectedSchool}_Data`);

        // Save the workbook
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

            {selectedSchool && students.length > 0 && (
                <div>
                    <button onClick={saveToDatabase}>Save to Database</button>
                    <button onClick={saveToExcel}>Save to Excel</button>

                    {/* Search Bar */}
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={handleSearchChange}
                        placeholder="Search by Name, Pen Number, or SNo"
                        style={{ margin: '10px 0' }}
                    />

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
                                {Array(7).fill(['FA1-20M', 'Children\'s Participation', 'Written Work', 'Speaking', 'Behaviour', 'SubTotal', 'Grade', 'SGPA']).flat().map(header => (
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
                </div>
            )}
        </div>
    );
}

// Render the component
const root = createRoot(document.getElementById('root'));
root.render(<StudentMarksEntry />);
