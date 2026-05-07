import { redirect } from "next/navigation";

// /profile without an ID redirects to home
export default function ProfileIndex() {
  redirect("/");
}
