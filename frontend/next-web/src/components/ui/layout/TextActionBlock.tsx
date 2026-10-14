import Button from "@/components/ui/buttons/Button";

interface TextActionBlockProps {
  title: string;
  description: string;
  buttonLabel: string;
  buttonVariant?: "primary" | "secondary" | "secondary-dark";
  onButtonClick?: () => void;
}

export default function TextActionBlock({
  title,
  description,
  buttonLabel,
  buttonVariant = "secondary-dark",
  onButtonClick,
}: TextActionBlockProps) {
  return (
    <div className="flex flex-col items-center justify-center w-full h-full flex-1 gap-4 sm:gap-5 px-6 sm:px-10 lg:pl-17 lg:pr-0">
      <h2 className="text-2xl sm:text-3xl font-bold text-center tracking-wide">{title}</h2>
      <p className="text-base sm:text-lg text-black/60 text-center sm:text-justify w-full sm:w-[80%] lg:w-[50%] leading-[1.3] sm:leading-[1.2]">
        {description}
      </p>
      <Button variant={buttonVariant} onClick={onButtonClick}>
        {buttonLabel}
      </Button>
    </div>
  );
}