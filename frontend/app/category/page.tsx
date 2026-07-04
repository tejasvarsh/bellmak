import Link from 'next/link'

const CATEGORIES = [
  { name:'Mobiles',     slug:'mobiles',      emoji:'📱', color:'from-blue-400 to-blue-600'      },
  { name:'Fashion',     slug:'fashion',      emoji:'👗', color:'from-pink-400 to-rose-500'      },
  { name:'Electronics', slug:'electronics',  emoji:'💻', color:'from-purple-400 to-violet-600'  },
  { name:'Home',        slug:'home-kitchen', emoji:'🏠', color:'from-green-400 to-emerald-500'  },
  { name:'Beauty',      slug:'beauty',       emoji:'💄', color:'from-rose-400 to-pink-600'      },
  { name:'Sports',      slug:'sports',       emoji:'⚽', color:'from-orange-400 to-red-500'     },
  { name:'Books',       slug:'books',        emoji:'📚', color:'from-amber-400 to-yellow-500'   },
  { name:'Grocery',     slug:'grocery',      emoji:'🛒', color:'from-lime-400 to-green-500'     },
  { name:'Toys',        slug:'toys',         emoji:'🧸', color:'from-yellow-400 to-amber-500'   },
  { name:'Appliances',  slug:'appliances',   emoji:'🔌', color:'from-cyan-400 to-blue-500'      },
  { name:'Furniture',   slug:'furniture',    emoji:'🪑', color:'from-stone-400 to-stone-600'    },
]

export default function CategoriesPage() {
  return (
    <div className="min-h-screen bg-[#f0f2f5] px-4 py-6">
      <h1 className="font-black text-xl text-gray-900 mb-5">All Categories</h1>
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
        {CATEGORIES.map(cat => (
          <Link key={cat.slug} href={`/category/${cat.slug}`}
            className="bg-white rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center gap-2 p-4 hover:shadow-md transition-all group">
            <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${cat.color} flex items-center justify-center text-2xl shadow-md group-hover:scale-110 transition-transform`}>
              {cat.emoji}
            </div>
            <span className="text-xs font-bold text-gray-700 text-center group-hover:text-[#F97316]">{cat.name}</span>
          </Link>
        ))}
      </div>
    </div>
  )
}