const enterMarksBtn = document.getElementById('enter-marks-btn');
const marksForm = document.getElementById('marks-form');
const sectionsList = document.getElementById('sections-list');
const classesList = document.getElementById('classes-list');
const marksTableContainer = document.getElementById('marks-table-container');
const marksTableBody = document.getElementById('marks-table-body');

enterMarksBtn.addEventListener('click', () => {
    marksForm.style.display = 'block';
});

sectionsList.addEventListener('click', (e) => {
    if (e.target.tagName === 'BUTTON') {
        const section = e.target.dataset.section;
        console.log(`Section selected: ${section}`);
        // generate table rows for the selected section
        generateTableRows(section);
    }
});

classesList.addEventListener('click', (e) => {
    if (e.target.tagName === 'BUTTON') {
        const classSelected = e.target.dataset.class;
        console.log(`Class selected: ${classSelected}`);
        // generate table rows for the selected class
        generateTableRows(classSelected);
    }
});

