const { useState, useEffect } = React;
const { createRoot } = ReactDOM;
const axios = window.axios;

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

// Calculate grade for the SG (Sub-Grade) column based on sub-total
const calculateSGGrade = (subTotal) => {
    if (subTotal >= 46) return 'A1';
    if (subTotal >= 41) return 'A2';
    if (subTotal >= 36) return 'B1';
    if (subTotal >= 31) return 'B2';
    if (subTotal >= 26) return 'C1';
    if (subTotal >= 21) return 'C2';
    if (subTotal >= 18) return 'D1';
    return 'D2';
};

// Calculate grade for the Total Grade column based on grand total
const calculateTotalGrade = (grandTotal) => {
    if (grandTotal >= 273) return 'A1';
    if (grandTotal >= 243) return 'A2';
    if (grandTotal >= 213) return 'B1';
    if (grandTotal >= 183) return 'B2';
    if (grandTotal >= 153) return 'C1';
    if (grandTotal >= 123) return 'C2';
    if (grandTotal >= 105) return 'D1';
    return 'D2';
};

const calculateSGPA = subTotal => (subTotal / 50 * 10).toFixed(1); // Assuming total max marks of 50

const calculateGPA = grandTotal => (grandTotal / 300 * 10).toFixed(1); // Updated assuming total max marks of 300

const calculatePercentage = grandTotal => ((grandTotal / 300) * 100).toFixed(1); // Updated assuming total max marks of 300

// React component
function StudentMarksEntry() {
    const [selectedSchool, setSelectedSchool] = useState('');
    const [students, setStudents] = useState([]);
    const [savedData, setSavedData] = useState({});
    const [searchQuery, setSearchQuery] = useState(''); // Add search query state
    const [filteredStudents, setFilteredStudents] = useState([]); // State for filtered students

    useEffect(() => {
        const fetchSchoolData = async (school) => {
            try {
                const response = await axios.get(`https://marksentry2024-default-rtdb.firebaseio.com/2024/FA-3/schools/${school}/Class-6.json`);
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
                    science: data[key].science || ['', '', '', '', '', 0, '', 0],
                    social: data[key].social || ['', '', '', '', '', 0, '', 0],
                    grandTotal: data[key].grandTotal || 0,
                    totalGrade: data[key].totalGrade || '',
                    gpa: data[key].gpa || 0,
                    percentage: data[key].percentage || 0
                }));
            } catch (error) {
                console.error("Error fetching data:", error);
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
            setFilteredStudents(allData); // Initialize filtered students with all data
        };

        if (selectedSchool) {
            if (selectedSchool === 'ALL') {
                fetchAllData();
            } else {
                fetchSchoolData(selectedSchool).then(data => {
                    setStudents(data);
                    setFilteredStudents(data); // Initialize filtered students with school-specific data
                });
            }
        }
    }, [selectedSchool]);

    // Recalculate totals, grades, SGPA, etc.
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

        // Recalculate sub-total, SG grade, and SGPA
        student[subject][5] = calculateTotal(student[subject]);
        student[subject][6] = calculateSGGrade(student[subject][5]); // Update SG grade calculation
        student[subject][7] = calculateSGPA(student[subject][5]);

        // Recalculate grand total, total grade, GPA, and percentage
        student.grandTotal = student.telugu[5] + student.hindi[5] + student.english[5] + student.mathematics[5] + student.science[5] + student.social[5];
        student.totalGrade = calculateTotalGrade(student.grandTotal); // Update Total Grade calculation
        student.gpa = calculateGPA(student.grandTotal);
        student.percentage = calculatePercentage(student.grandTotal);

        // Update state
        setStudents(newStudents);
        setFilteredStudents(newStudents); // Update filtered students
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

    const saveToDatabase = async () => {
        if (!selectedSchool) {
            alert('Please select a school first.');
            return;
        }

        // Notify the user that data is being saved
        alert('Data is saving to the database...');

        axios
            .put(`https://marksentry2024-default-rtdb.firebaseio.com/2024/FA-3/schools/${selectedSchool}/Class-6.json`, students)
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
            "FA3-20M", "Children's Participation", "Written Work", "Speaking", "Behaviour", "SubTotal", "Grade", "SGPA",
            "FA3-20M", "Children's Participation", "Written Work", "Speaking", "Behaviour", "SubTotal", "Grade", "SGPA",
            "FA3-20M", "Children's Participation", "Written Work", "Speaking", "Behaviour", "SubTotal", "Grade", "SGPA",
            "FA3-20M", "Children's Participation", "Written Work", "Speaking", "Behaviour", "SubTotal", "Grade", "SGPA",
            "FA3-20M", "Children's Participation", "Written Work", "Speaking", "Behaviour", "SubTotal", "Grade", "SGPA",
            "FA3-20M", "Children's Participation", "Written Work", "Speaking", "Behaviour", "SubTotal", "Grade", "SGPA",
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

        XLSX.utils.book_append_sheet(wb, ws, 'Student Data');
        XLSX.writeFile(wb, 'student_data.xlsx');
    };

    // Handle search input change
    const handleSearchChange = (e) => {
        const query = e.target.value;

        // Ensure input is either alphabets or numerals only
        if (/^[a-zA-Z]*$|^[0-9]*$/.test(query)) {
            setSearchQuery(query);
        } else {
            alert('Only alphabetic or numeric input is allowed.');
        }
    };

    // Handle search functionality
    const handleSearchKeyPress = (e) => {
        if (e.key === 'Enter') {
            const filtered = students.filter(student =>
                student.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                student.penNumber.toString().includes(searchQuery) ||
                student.sno.toString() === searchQuery
            );
            setFilteredStudents(filtered); // Update filtered students list
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
                    <input
                        type="text"
                        placeholder="Search by Student Name, Pen Number, or Sno"
                        value={searchQuery}
                        onChange={handleSearchChange}
                        onKeyPress={handleSearchKeyPress}
                    />
                    <table>
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
                                {['Telugu', 'Hindi', 'English', 'Mathematics', 'Science', 'Social'].flatMap(subject =>
                                    ['FA3-20M', "Children's Participation", 'Written Work', 'Speaking', 'Behaviour', 'SubTotal', 'Grade', 'SGPA']
                                        .map(sub => <th key={`${subject}-${sub}`}>{sub}</th>)
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
                                    {['telugu', 'hindi', 'english', 'mathematics', 'science', 'social'].flatMap(subject =>
                                        student[subject].map((value, subIndex) => (
                                            <td key={`${subject}-${subIndex}`}>
                                                {subIndex < 5 ? (
                                                    <input
                                                        id={`input-${index}-${subject}-${subIndex}`}
                                                        type="number"
                                                        value={value}
                                                        onChange={e => handleInputChange(index, subject, subIndex, e.target.value)}
                                                        onKeyDown={e => handleKeyDown(e, index, subject, subIndex)}
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
                    <button onClick={saveToDatabase}>Save to Database</button>
                    <button onClick={saveToExcel}>Save to Excel</button>
                </div>
            )}
        </div>
    );
}

createRoot(document.getElementById('root')).render(<StudentMarksEntry />);
