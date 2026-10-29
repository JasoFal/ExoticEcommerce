import Link from "next/link";

export default function Home() {
  return (
    <main>
      <h1>Home</h1>
      {/* TEMP: route scaffold */}
      <ul>
        <li>
          <Link href="/shop?q=gecko">Search</Link>
        </li>
        <li>
          <Link href="/shop?department=live-animals">Department</Link>
        </li>
        <li>
          <Link href="/shop?animal_type=lizard">Animal Type</Link>
        </li>
        <li>
          <Link href="/products/example">Beginner-friendly pick</Link>
        </li>
      </ul>
    </main>
  );
}
