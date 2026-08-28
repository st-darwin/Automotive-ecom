import { Link, useLocation } from 'react-router-dom'
import { Plus, Car } from 'lucide-react'

interface Props {
    title: string;
    description: string;
    ctaUrl?: string;
    ctaText?: string;
}

const Header = ({ title, description, ctaText, ctaUrl }: Props) => {
    const location = useLocation()
    const isRoot = location.pathname === "/admin" || location.pathname === "/admin/"

    return (
        <header className="relative flex flex-col md:flex-row md:items-end justify-between gap-8 pb-10 mb-8">
            {/* Soft minimal anchor line */}
            <div className="absolute bottom-0 left-0 h-[1px] w-full bg-gradient-to-r from-slate-200 via-blue-400/40 to-transparent" />
            
            <article className="relative space-y-3">
               {/* Minimal badge style */}
                <div className="inline-flex mt-2 items-center gap-2 px-3 py-1 rounded-full bg-blue-50/80 border border-blue-100/60 text-[11px] font-semibold uppercase tracking-wider text-blue-600 shadow-sm shadow-blue-500/5">
                    <Car size={13} strokeWidth={2.5} />
                    <span>kinchris switch / {isRoot ? "Dashboard" : "Management"}</span>
                </div>

                <h1 className={
                    isRoot 
                        ? "text-slate-900 tracking-tight font-extrabold transition-all duration-300 text-3xl md:text-5xl" 
                        : "text-slate-900 tracking-tight font-extrabold transition-all duration-300 text-2xl md:text-4xl"
                }>
                    {title}
                </h1>

                <p className="text-slate-500 font-medium leading-relaxed max-w-[520px] text-sm md:text-base border-l-2 border-blue-400/40 pl-4 py-0.5">
                    {description}
                </p>
            </article>
            
            {ctaUrl && ctaText && (
                <div className="flex items-center">
                    <Link 
                        to={ctaUrl} 
                        className="group relative inline-flex items-center gap-3 overflow-hidden rounded-2xl bg-white border border-slate-200/80 px-6 py-3.5 shadow-sm hover:shadow-md hover:border-blue-300 transition-all duration-300 active:scale-95"
                    >
                        {/* Soft hover background highlight */}
                        <div className="absolute inset-0 bg-blue-50/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                        
                        <div className="relative flex h-7 w-7 items-center justify-center rounded-xl bg-blue-400 text-white shadow-sm shadow-blue-400/30 transition-transform duration-300 group-hover:scale-105">
                            <Plus size={14} strokeWidth={2.5} />
                        </div>
                        <span className="relative text-sm font-semibold tracking-tight text-slate-800 group-hover:text-blue-600 transition-colors">
                            {ctaText}
                        </span>
                    </Link>
                </div>
            )}
        </header>
    )
}

export default Header