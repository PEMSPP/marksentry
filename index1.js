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
        const fetchSchoolDataFromFirebase = async (school) => {
            const response = await axios.get(`https://marksentry-bcdd1-default-rtdb.firebaseio.com/${school}.json`);
            const data = response.data || [];
            return Object.keys(data).map((key, index) => ({
                sno: index + 1,
                studentName: data[key].studentName,
                penNumber: data[key].penNumber,
                section: data[key].section, // Fetch section from Firebase
                telugu: data[key].telugu || ['', '', '', '', '', '', '', 0, '', 0],
                hindi: data[key].hindi || ['', '', '', '', '', '', '', 0, '', 0],
                english: data[key].english || ['', '', '', '', '', '', '', 0, '', 0],
                mathematics: data[key].mathematics || ['', '', '', '', '', '', '', 0, '', 0],
                social: data[key].social || ['', '', '', '', '', '', '', 0, '', 0], // Updated Subjects
                grandTotal: data[key].grandTotal || 0,
                totalGrade: data[key].totalGrade || '',
                gpa: data[key].gpa || 0,
                percentage: data[key].percentage || 0
            }));
        };

        const fetchAllDataFromFirebase = async () => {
            const allData = [];
            let snoCounter = 1; // Initialize SNO counter
            for (const school of schools.slice(0, -1)) {
                const schoolData = await fetchSchoolDataFromFirebase(school.name);
                schoolData.forEach(student => {
                    student.sno = snoCounter++; // Assign continuous SNO
                    allData.push(student);
                });
            }
            setStudents(allData);
        };

        if (selectedSchool) {
            if (selectedSchool === 'ALL') {
                fetchAllDataFromFirebase();
            } else {
                fetchSchoolDataFromFirebase(selectedSchool).then(setStudents);
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

    const handleKeyDown = (e, index, subject, subIndex) => {
        // Keyboard navigation logic remains the same
        // Prevent default behavior of arrow keys and enter key
    };

    const saveDataToDatabase = () => {
        if (!selectedSchool) {
            alert('Please select a school first.');
            return;
        }
    
        // Notify the user that data is being saved
        alert('Data is saving to the database...');
    
        axios
            .put(`https://marksentry-bcdd1-default-rtdb.firebaseio.com/${selectedSchool}.json`, students)
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
        // Save to Excel logic remains the same
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
                    <table>
                        <thead>
                          <tr>
                        <th rowSpan="2">Sno</th>
                        <th rowSpan="2">Student Name</th>
                        <th rowSpan="2">Pen Number</th>
                        <th rowSpan="2">Section</th>
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
                        {["Telugu", "Hindi", "English", "Mathematics", "Social"].flatMap(subject =>
                            ["FA1-20M", "Speaking", "Basic Knowledge", "Writing", "Corrections", "Behaviour", "Activity", "SubTotal", "Grade", "SGPA"]
                                .map((sub, i) => <th key={`${subject}-${sub}`}>{sub}</th>)
                                
                        )}
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
                                        student[subject].map((value, subIndex) => (
                                            <td key={subIndex}>
                                                <input
                                                    id={`input-${index}-${subject}-${subIndex}`}
                                                    type="number"
                                                    value={value}
                                                    onChange={e => handleInputChange(index, subject, subIndex, e.target.value)}
                                                    onKeyDown={e => handleKeyDown(e, index, subject, subIndex)}
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
                </div>
            )}
            <button onClick={saveToExcel}>Save to Excel</button>
            <button onClick={saveDataToDatabase}>Save to Database</button>
        </div>
    );
}

const root = createRoot(document.getElementById('root'));
root.render(<StudentMarksEntry />);
