interface NewsletterIntroProps {
  image: string;
  imageAlt: string;
  title: string;
  description: string;
  descriptionClassName?: string;
}

export function NewsletterIntro({
  image,
  imageAlt,
  title,
  description,
  descriptionClassName = "w-full sm:w-[70%] md:w-[45%] lg:w-[30%]",
}: NewsletterIntroProps) {
  return (
    <>
      <div className="relative">
        <img src={image} alt={imageAlt} className="rounded-xl w-full" />
        <div className="absolute bottom-0 left-0 w-full h-16 sm:h-20 lg:h-24 bg-gradient-to-b from-transparent to-white rounded-b-xl" />
      </div>
      <h2 className="text-2xl sm:text-3xl lg:text-4xl text-center tracking-wide px-4 sm:px-0">
        {title}
      </h2>
      <p className={`text-base sm:text-lg text-black/60 text-center leading-[1.2] px-4 sm:px-0 ${descriptionClassName}`}>
        {description}
      </p>
    </>
  );
}