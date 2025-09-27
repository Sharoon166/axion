import React from "react";
import Image from "next/image";
import Link from "next/link";

const NotFound = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen ">
      <Image
        src="/404-error-page.jpg"
        alt="404 Error"
        width={600}
        height={300}
        className="rounded-lg shadow-lg"
        priority
      />
      <h1 className="text-3xl font-bold mt-6 text-gray-800">Page Not Found</h1>
      <p className="text-gray-600 mt-2">
        The page you are looking for doesn&apos;t exist or has been moved.
      </p>
      <Link href="/" className="mt-6 px-6 py-3 text-white rounded-lg bg-[#0077B6] transition">
        Go Home
      </Link>
    </div>
  );
};

export default NotFound;
