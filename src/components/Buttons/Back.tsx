import { ChevronLeft } from "lucide-react"
import { Link } from "react-router-dom"

export default function BackButton ({onBack, link=false }) {
    if (link) {
        return (
            <Link
            to={onBack}
            className="bg-white shadow-md p-2 mb-4 block w-fit rounded-2xl border px-3 border-slate-300 flex items-center gap-1"
            >
                <ChevronLeft/> Voltar
            </Link>
        )
    }
    return (
        <button
        onClick={onBack}
        className="bg-white shadow-md p-2 mb-4 block w-fit rounded-2xl border px-3 border-slate-300 flex items-center gap-1"
        >
            <ChevronLeft/> Voltar
        </button>
    )
}