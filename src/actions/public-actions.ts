"use server";

export async function getRandomStudent() {
  const DUMMY_STUDENTS = [
    { full_name: "Aarav Sharma", class_name: "X - A" },
    { full_name: "Diya Patel", class_name: "IX - B" },
    { full_name: "Rohan Gupta", class_name: "XI - SCIENCE" },
    { full_name: "Isha Singh", class_name: "VIII - A" },
    { full_name: "Kabir Verma", class_name: "XII - COMMERCE" }
  ];
  
  const randomIndex = Math.floor(Math.random() * DUMMY_STUDENTS.length);
  return DUMMY_STUDENTS[randomIndex];
}
