import { redirect } from "next/navigation";

/**
 * The dashboard has one destination; send the root there so a bare visit lands on
 * the product list (and the auth guard can bounce it to the login screen).
 */
export default function HomePage() {
  redirect("/products");
}
