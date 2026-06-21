import { MathText } from "../math";

export function MathContent({
  content,
  className = "",
}: {
  content: string;
  className?: string;
}) {
  return (
    <div className={`math-content ${className}`}>
      {content.split(/\n{2,}/).map((paragraph, index) => (
        <div className="math-paragraph" key={index}>
          <MathText>{paragraph}</MathText>
        </div>
      ))}
    </div>
  );
}
