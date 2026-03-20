import Link from 'next/link'

const categories = [
  { name: 'Mobiles', emoji: '📱', slug: 'mobiles' },
  { name: 'Electronics', emoji: '💻', slug: 'electronics' },
  { name: 'Fashion', emoji: '👗', slug: 'fashion' },
  { name: 'Home', emoji: '🏠', slug: 'home-kitchen' },
  { name: 'Beauty', emoji: '💄', slug: 'beauty' },
  { name: 'Sports', emoji: '⚽', slug: 'sports' },
  { name: 'Books', emoji: '📚', slug: 'books' },
  { name: 'Toys', emoji: '🧸', slug: 'toys' },
  { name: 'Grocery', emoji: '🛒', slug: 'grocery' },
  { name: 'Appliances', emoji: '🔌', slug: 'appliances' },
]

export default function CategoryIcons() {
  return (
    <section className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4">
        <div className="grid grid-cols-5 md:grid-cols-10">
          {categories.map((cat, i) => (
            <Link key={cat.slug} href={`/category/${cat.slug}`}
              className="group flex flex-col items-center gap-2 py-5 px-2 hover:bg-orange-50 transition-colors border-b-2 border-transparent hover:border-primary">
              <div className="w-12 h-12 bg-orange-50 group-hover:bg-white rounded-2xl flex items-center justify-center shadow-sm group-hover:shadow-md transition-all duration-300 group-hover:scale-110">
                <span className="text-2xl">{cat.emoji}</span>
              </div>
              <span className="text-xs font-semibold text-gray-600 group-hover:text-primary text-center transition-colors">
                {cat.name}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
