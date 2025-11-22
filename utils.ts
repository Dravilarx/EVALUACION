
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

    // Round to 1 decimal place
    return Math.round(grade * 10) / 10;
};

export const getGradeColor = (grade: number): string => {
    if (grade >= 4.0) return "text-primary"; // Blue/Primary for passing
    return "text-danger"; // Red for failing
};
