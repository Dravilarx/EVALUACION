
export const calculateGrade = (score: number, maxScore: number): number => {
    const minGrade = 1.0;
    const maxGrade = 7.0;
    const passingGrade = 4.0;
    const demand = 0.60; // 60% exigencia

    if (maxScore === 0) return minGrade;

    const passingScore = maxScore * demand;
    let grade;

    if (score < passingScore) {
        // Formula for grades below passing (1.0 to 3.9)
        // Grade = Min + (PassingGrade - Min) * (Score / PassingScore)
        grade = minGrade + (passingGrade - minGrade) * (score / passingScore);
    } else {
        // Formula for grades above passing (4.0 to 7.0)
        // Grade = PassingGrade + (MaxGrade - PassingGrade) * ((Score - PassingScore) / (MaxScore - PassingScore))
        grade = passingGrade + (maxGrade - passingGrade) * ((score - passingScore) / (maxScore - passingScore));
    }

    // Round to 2 decimal places for Grade Book precision
    return Math.round(grade * 100) / 100;
};

export const getGradeColor = (grade: number): string => {
    if (grade >= 4.0) return "text-primary"; // Blue/Primary for passing
    return "text-danger"; // Red for failing
};

export const exportToCSV = (data: any[], filename: string) => {
    if (!data.length) {
        alert("No hay datos para exportar.");
        return;
    }
    const headers = Object.keys(data[0]);
    const csvRows = [
        headers.join(','),
        ...data.map(row => headers.map(fieldName => {
            const val = (row as any)[fieldName];
            // Escape double quotes and wrap in double quotes to handle commas/newlines
            const escaped = ('' + (val ?? '')).replace(/"/g, '""');
            return `"${escaped}"`;
        }).join(','))
    ];
    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('hidden', '');
    a.setAttribute('href', url);
    a.setAttribute('download', `${filename}.csv`);
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
};
