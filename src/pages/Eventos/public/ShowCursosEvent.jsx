import React, { useState } from "react";
import { CheckCircle2, Calendar, Clock, ChevronDown, ChevronUp, DollarSign, Tag } from "lucide-react";

const CourseCard = ({
  checked,
  onToggle,
  label,
  price,
  formattedPrice,
  subtitle = "",
  description,
  date,
  isFull,
  end,
  imageUrl, // 🔥 vem por props
}) => {
  const [showDescription, setShowDescription] = useState(false);

  const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
};

const formatTime = (dateString) => {
  return dateString.split('T')[1].slice(0, 5);
};

  return (
    <div
      className={`group relative flex flex-col rounded-2xl border-2 transition-all duration-300 overflow-hidden mb-4
        ${
          checked
            ? "border-green-700 bg-blue-50/40 shadow-md"
            : "border-slate-100 bg-white hover:border-slate-200 shadow-sm"
        }`}
    >
      {/* CONTEÚDO PRINCIPAL */}
      <div className="flex flex-row  gap-4 p-4 items-start sm:items-center">
        
        {/* CHECKBOX */}
        {!isFull &&
        <div
          onClick={onToggle}
          className={`flex-shrink-0 w-6 h-6 rounded-md border-2 cursor-pointer transition-all flex items-center justify-center
            ${checked ? "bg-green-700 border-green-600" : "bg-white border-slate-300"}`}
        >
          {checked && <CheckCircle2 className="w-4 h-4 text-white" />}
        </div>}

        {/* IMAGEM */}
        <div className="relative w-36 sm:w-28 md:w-32 aspect-video sm:aspect-[4/3] md:aspect-video shrink-0 overflow-hidden rounded-xl ">
          <img
            src={imageUrl || "https://images.unsplash.com/photo-1586281380349-632531db7ed4?q=80&w=300&auto=format&fit=crop"}
            alt={label}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            onError={(e) => {
              e.currentTarget.src =
                "https://images.unsplash.com/photo-1586281380349-632531db7ed4?q=80&w=300&auto=format&fit=crop";
            }}
          />
        </div>

        {/* TEXTO */}
        <div className="flex-1 flex flex-col w-full">
          <div className="flex justify-between items-start gap-2">
            <h3
              className={`font-bold text-sm sm:text-lg leading-tight transition-colors ${
                checked ? "text-blue-900" : isFull ? 'text-red-400' : "text-slate-800"
              } `}
            >
              {label}
            </h3>

            <span className="font-bold text-blue-600 text-sm sm:text-base whitespace-nowrap">
              {price === 0 ? "Grátis" : formattedPrice}
            </span>
          </div>

            {/* INFO */}  
            <div className="flex flex-wrap items-center gap-3 mt-2 text-slate-700 text-xs sm:text-sm">
                {date && (
                    <div className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>{formatDate(date)}</span>
                    </div>
                )}

                {date && end && (
                    <div className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    <span>
                        {formatTime(date)} às {formatTime(end)}
                    </span>
                    </div>
                )}
            </div>
        </div>

      </div>
    <div className="w-full flex">
        <button
            onClick={() => setShowDescription(!showDescription)}
            className="flex items-center gap-1 px-3 py-1.5 rounded-t-lg bg-green-900 hover:bg-green-700 text-white text-xs rounded-l-none transition-colors self-end sm:self-center"
        >
            {showDescription ? (
            <ChevronUp className="w-4 h-4" />
            ) : (
            <ChevronDown className="w-4 h-4" />
            )}
            <span className="inline">Descrição</span>
        </button>

       <div className="flex ml-2 items-center gap-1 text-green-800 font-bold text-sm sm:text-base">
            <Tag className="w-4 h-4" />
            <span>R$ {Number(price)?.toFixed(2)}</span>
        </div>
    </div>

      {/* DESCRIÇÃO */}
      <div
        className={`transition-all duration-300 overflow-y-auto ${
          showDescription ? "max-h-40 opacity-100 px-4 pb-4" : "max-h-0 opacity-0"
        }`}
      >
        <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-slate-600 text-sm leading-relaxed">
          {description}
        </div>
      </div>
    </div>
  );
};

export default CourseCard;