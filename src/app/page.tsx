import Link from "next/link";

const features = [
  {
    title: "Recommend a Book",
    description: "AI-powered picks based on your library",
    href: "/books/recommend",
    icon: (
      <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
      </svg>
    ),
    gradient: "from-amber-600 to-orange-700",
  },
  {
    title: "Bookstore Scanner",
    description: "Snap a shelf, get personalized picks",
    href: "/books/scan",
    icon: (
      <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z" />
      </svg>
    ),
    gradient: "from-emerald-600 to-teal-700",
  },
  {
    title: "What Should I Watch?",
    description: "Find your next binge on your services",
    href: "/movies/recommend",
    icon: (
      <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 20.25h12m-7.5-3v3m3-3v3m-10.125-3h17.25c.621 0 1.125-.504 1.125-1.125V4.875c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125z" />
      </svg>
    ),
    gradient: "from-violet-600 to-purple-700",
  },
  {
    title: "Plane Movie Scanner",
    description: "Scan the seatback screen for top picks",
    href: "/movies/scan",
    icon: (
      <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
      </svg>
    ),
    gradient: "from-sky-600 to-blue-700",
  },
];

export default function Home() {
  return (
    <main className="min-h-screen bg-stone-950 px-4 pb-8 pt-12">
      <div className="mx-auto max-w-md">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-amber-50">MediaRec</h1>
          <p className="mt-1 text-sm text-stone-400">
            Your personal recommendation engine
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4">
          {features.map((f) => (
            <Link
              key={f.href}
              href={f.href}
              className={`group flex items-center gap-4 rounded-2xl bg-gradient-to-r ${f.gradient} p-5 shadow-lg transition-transform active:scale-[0.98]`}
            >
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-white/15 text-white">
                {f.icon}
              </div>
              <div>
                <h2 className="text-lg font-semibold text-white">
                  {f.title}
                </h2>
                <p className="text-sm text-white/70">{f.description}</p>
              </div>
              <svg className="ml-auto h-5 w-5 text-white/50 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          ))}
        </div>

        <div className="mt-8">
          <h2 className="mb-3 text-center text-sm font-medium text-stone-400">
            My Library
          </h2>
          <div className="flex justify-center gap-3">
            <Link
              href="/books/add"
              className="flex items-center gap-2 rounded-full border border-stone-700 px-5 py-2.5 text-sm text-stone-400 transition-colors hover:border-amber-600 hover:text-amber-50"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              Add Book
            </Link>
            <Link
              href="/movies/add"
              className="flex items-center gap-2 rounded-full border border-stone-700 px-5 py-2.5 text-sm text-stone-400 transition-colors hover:border-violet-500 hover:text-violet-300"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              Add Movie/Show
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
