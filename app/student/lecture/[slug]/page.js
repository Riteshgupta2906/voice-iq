import { redirect } from "next/navigation";

// Lectures are now viewed inline on the student dashboard.
export default function LectureDetailPage() {
  redirect("/student");
}
