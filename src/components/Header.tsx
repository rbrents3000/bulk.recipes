import Link from "next/link";

export default function Header() {
  return (
    <header className="border-b border-gray-200 bg-white">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-2xl font-bold text-red-600">bulk</span>
            <span className="text-2xl font-bold text-gray-900">.recipes</span>
          </Link>
          <nav className="flex items-center gap-6 text-sm font-medium text-gray-600">
            <Link href="/" className="hover:text-gray-900 transition-colors">
              Recipes
            </Link>
            <Link href="/categories" className="hover:text-gray-900 transition-colors">
              Categories
            </Link>
            <Link href="/products" className="hover:text-gray-900 transition-colors">
              Costco Products
            </Link>
          </nav>
        </div>
      </div>
    </header>
  );
}
