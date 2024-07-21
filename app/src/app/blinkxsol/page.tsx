"use client";

import Link from 'next/link';

const Page = () => {
  return (
    <div>
      <Link href="https://dial.to/?action=solana-action:http://localhost:3000/api/blink">
        <button>Go to Link</button>
      </Link>
    </div>
  );
};

export default Page;