import { notFound, redirect } from "next/navigation";

export default function SwaggerPage() {
  if (process.env.NODE_ENV !== "development") {
    notFound();
  }

  redirect("/swagger/viewer");
}
