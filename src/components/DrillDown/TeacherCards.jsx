import TeacherCell from './TeacherCell';

export default function TeacherCards({ teachers, activeTeacher, onTeacherClick }) {
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
      gap: 12,
    }}>
      {teachers.map(teacher => (
        <TeacherCell
          key={teacher.teacherName}
          teacher={teacher}
          isActive={activeTeacher === teacher.teacherName}
          onClick={() => onTeacherClick(teacher.teacherName)}
        />
      ))}
    </div>
  );
}
