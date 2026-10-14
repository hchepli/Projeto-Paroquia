import { MoveRight } from "lucide-react";

interface NewsletterFormProps {
  placeholder?: string;
  buttonLabel?: string;
  onSubmit?: (email: string) => void;
  className?: string;
  size?: "default" | "lg";
}

export function NewsletterForm({
  placeholder = "Seu melhor email!",
  buttonLabel = "Se Inscreva Agora",
  onSubmit,
  className = "",
  size = "default",
}: NewsletterFormProps) {
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const email = new FormData(e.currentTarget).get("email") as string;
    onSubmit?.(email);
  };

  const textSizes = {
    default: "text-xs sm:text-base",
    lg: "text-sm sm:text-lg",
  };

  const buttonPaddings = {
    default: "px-3 sm:px-6 py-3 sm:py-5",
    lg: "px-4 sm:px-7 py-4 sm:py-6",
  };

  const inputPaddings = {
    default: "py-3 sm:py-0",
    lg: "py-4 sm:py-0",
  };

  const iconSizes = {
    default: { base: 18, sm: 24 },
    lg: { base: 21, sm: 28 },
  };

  return (
    <form
      onSubmit={handleSubmit}
      className={`flex items-center bg-white rounded-full border border-black/10 pl-3 sm:pl-5 shadow-sm mt-2 ${className}`}
    >
      <input
        type="email"
        name="email"
        placeholder={placeholder}
        required
        className={`flex-1 min-w-0 bg-transparent outline-none text-black/80 placeholder:text-black/40 ${textSizes[size]} ${inputPaddings[size]}`}
      />
      <button
        type="submit"
        className={`flex items-center gap-1 sm:gap-2 bg-[#7A0C1E] text-white rounded-full h-full font-medium hover:bg-[#661828] transition-colors whitespace-nowrap ${buttonPaddings[size]} ${textSizes[size]}`}
      >
        {buttonLabel}
        <MoveRight size={iconSizes[size].base} className="sm:hidden" />
        <MoveRight size={iconSizes[size].sm} className="hidden sm:block" />
      </button>
    </form>
  );
}